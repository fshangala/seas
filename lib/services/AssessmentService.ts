import { supabase } from '../supabase'
import { idb } from '../idb'
import { Tables } from '../types/database.types'

export type SubmissionWithAssessment = Tables<'submissions'> & {
  assessments: Tables<'assessments'>
}

export interface BulkQuestion {
  content: string
  question_type: string
  marks_possible: number
  options?: string[]
}

export class AssessmentService {
  async getAssessmentByCode(code: string) {
    // 1. Fetch Assessment
    const { data: assessment, error: aError } = await supabase
      .from('assessments')
      .select('*')
      .eq('assessment_code', code)
      .single()

    if (aError || !assessment) throw new Error('Assessment not found')

    // 2. Fetch Questions & Options
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('assessment_id', assessment.id)
      .order('order_index', { ascending: true })

    if (qError) throw new Error('Failed to fetch questions')

    const fullAssessment = {
      ...assessment,
      questions: questions || []
    }

    // 3. Cache in IndexedDB
    await idb.init()
    const db = idb.db
    if (!db) throw new Error('Database not initialized')
    const transaction = db.transaction(['assessment_cache'], 'readwrite')
    const store = transaction.objectStore('assessment_cache')
    store.put(fullAssessment)

    return fullAssessment
  }

  async startSubmission(assessmentId: string, studentId: string) {
    // 1. Check if submission already exists (pre-emptive check)
    const existing = await this.getSubmission(assessmentId, studentId)
    if (existing) return existing

    // 2. Attempt to insert
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        client_start_time: new Date().toISOString(),
        grading_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      // 3. Handle race condition: if it was created between our check and insert
      if (error.code === '23505') {
        return this.getSubmission(assessmentId, studentId)
      }
      throw error
    }
    return data
  }

  async getSubmission(assessmentId: string, studentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async getSubmissionsByStudent(studentId: string): Promise<SubmissionWithAssessment[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, assessments(title, assessment_code)')
      .eq('student_id', studentId)
      .order('server_received_at', { ascending: false })

    if (error) throw error
    return data as unknown as SubmissionWithAssessment[]
  }

  async getSubmissionDetails(studentId: string, assessmentId: string): Promise<SubmissionWithAssessment> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, assessments(title, assessment_code, description, duration_minutes)')
      .eq('student_id', studentId)
      .eq('assessment_id', assessmentId)
      .single()

    if (error) throw error
    return data as unknown as SubmissionWithAssessment
  }

  async syncResponses(submissionId: string) {
    const localResponses = await idb.getResponses()
    const unsynced = localResponses.filter(r => !r.synced)

    for (const resp of unsynced) {
      const { error } = await supabase
        .from('responses')
        .upsert({
          submission_id: submissionId,
          question_id: resp.question_id,
          selected_option_id: resp.selected_option_id,
          text_value: resp.text_value,
          image_response_url: resp.image_response_url
        })

      if (!error) {
        await idb.saveResponse({ ...resp, synced: true })
      }
    }
  }

  async getExaminerAssessments() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('assessments')
      .select('*, questions(count)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createAssessment(title: string, durationMinutes: number, description?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('assessments')
      .insert({
        title,
        duration_minutes: durationMinutes,
        description,
        created_by: user.id,
        is_published: false,
        assessment_code: `DRAFT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAssessment(id: string, updates: Partial<Tables<'assessments'>>) {
    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async publishAssessment(id: string) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase
      .from('assessments')
      .update({
        is_published: true,
        assessment_code: code
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async duplicateAssessment(id: string) {
    // 1. Fetch original
    const { data: original, error: oError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single()
    if (oError) throw oError

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('assessment_id', id)
    if (qError) throw qError

    // 2. Create new assessment
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: duplicate, error: dError } = await supabase
      .from('assessments')
      .insert({
        title: `${original.title} (Copy)`,
        duration_minutes: original.duration_minutes,
        description: original.description,
        created_by: user.id,
        is_published: false,
        assessment_code: `DRAFT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      })
      .select()
      .single()
    if (dError) throw dError

    // 3. Clone questions and options
    for (const q of (questions || [])) {
      const { data: newQ, error: nqError } = await supabase
        .from('questions')
        .insert({
          assessment_id: duplicate.id,
          content: q.content,
          question_type: q.question_type,
          marks_possible: q.marks_possible,
          order_index: q.order_index
        })
        .select()
        .single()
      
      if (nqError) throw nqError

      if (q.options && q.options.length > 0) {
        const { error: noError } = await supabase
          .from('options')
          .insert(q.options.map((o: Tables<'options'>) => ({
            question_id: newQ.id,
            content: o.content
          })))
        if (noError) throw noError
      }
    }

    return duplicate
  }

  async deleteAssessment(id: string) {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async addQuestion(assessmentId: string, question: Partial<Tables<'questions'>>, options?: string[]) {
    const { data: qData, error: qError } = await supabase
      .from('questions')
      .insert({
        content: question.content || '',
        question_type: question.question_type,
        marks_possible: question.marks_possible,
        order_index: question.order_index,
        assessment_id: assessmentId,
      })
      .select()
      .single()

    if (qError) throw qError

    if (options && options.length > 0) {
      const { error: oError } = await supabase
        .from('options')
        .insert(options.map(content => ({
          question_id: qData.id,
          content
        })))
      
      if (oError) throw oError
    }

    return qData
  }

  async updateQuestion(id: string, updates: Partial<Tables<'questions'>>, options?: { id?: string, content: string }[]) {
    const { error: qError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)

    if (qError) throw qError

    if (options) {
      // Simple approach: delete all and re-add if they don't have IDs, or update if they do.
      // For simplicity in this MVP, let's assume we replace them or manage them separately.
      // A more robust way would be to diff them.
    }
  }

  async deleteQuestion(id: string) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async clearQuestions(assessmentId: string) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('assessment_id', assessmentId)
    
    if (error) throw error
  }

  async addQuestionsBulk(assessmentId: string, questions: BulkQuestion[]) {
    // Get current max order_index
    const { data: existingQ } = await supabase
      .from('questions')
      .select('order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index', { ascending: false })
      .limit(1)
    
    let nextIndex = 0
    if (existingQ && existingQ.length > 0 && existingQ[0].order_index !== null) {
      nextIndex = existingQ[0].order_index + 1
    }

    for (const q of questions) {
      await this.addQuestion(assessmentId, {
        content: q.content,
        question_type: q.question_type,
        marks_possible: q.marks_possible,
        order_index: nextIndex++
      }, q.options)
    }
  }

  async completeSubmission(submissionId: string) {
    const { error } = await supabase
      .from('submissions')
      .update({
        client_end_time: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (error) throw error
  }

  async getPublishedAssessments() {
    const { data, error } = await supabase
      .from('assessments')
      .select('*, questions(id, content, question_type, marks_possible, marking_keys(id))')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getMarkingKeys(assessmentId: string) {
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, content, question_type, options(*), marking_keys(*)')
      .eq('assessment_id', assessmentId)
      .order('order_index', { ascending: true })

    if (qError) throw qError
    return questions
  }

  async saveMarkingKeys(keys: Partial<Tables<'marking_keys'>>[]) {
    for (const key of keys) {
      if (!key.question_id) continue
      
      const { error } = await supabase
        .from('marking_keys')
        .upsert(key, { onConflict: 'question_id' })
      if (error) throw error
    }
  }

  async getSubmissions(assessmentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('server_received_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getSubmissionWithResponses(submissionId: string) {
    const { data: submission, error: sError } = await supabase
      .from('submissions')
      .select('*, assessments(*)')
      .eq('id', submissionId)
      .single()
    
    if (sError) throw sError

    const { data: responses, error: rError } = await supabase
      .from('responses')
      .select('*, questions(*, options(*), marking_keys(*))')
      .eq('submission_id', submissionId)

    if (rError) throw rError

    return {
      ...submission,
      responses: responses || []
    }
  }

  async saveGrades(submissionId: string, responseGrades: { id: string, marks_awarded: number, is_graded: boolean }[]) {
    // 1. Update individual responses
    for (const grade of responseGrades) {
      const { error } = await supabase
        .from('responses')
        .update({
          marks_awarded: grade.marks_awarded,
          is_graded: grade.is_graded
        })
        .eq('id', grade.id)
      
      if (error) throw error
    }

    // 2. Calculate totals and update submission
    const manualScore = responseGrades.reduce((acc, curr) => acc + (curr.marks_awarded || 0), 0)
    
    // Fetch current auto_score and penalty
    const { data: sub } = await supabase.from('submissions').select('auto_score, penalty_applied').eq('id', submissionId).single()
    
    const totalScore = (sub?.auto_score || 0) + manualScore - (sub?.penalty_applied || 0)

    const { error: subError } = await supabase
      .from('submissions')
      .update({
        manual_score: manualScore,
        total_score: totalScore,
        grading_status: 'completed'
      })
      .eq('id', submissionId)

    if (subError) throw subError
  }
}

export const assessmentService = new AssessmentService()
