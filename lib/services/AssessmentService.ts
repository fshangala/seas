import { supabase } from '../supabase'
import { idb } from '../idb'
import { Tables } from '../types/database.types'

export type SubmissionWithAssessment = Tables<'submissions'> & {
  assessments: {
    title: string
    assessment_code: string
  }
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
    // Check if submission already exists
    const existing = await this.getSubmission(assessmentId, studentId)
    if (existing) return existing

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

    if (error) throw error
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

  async completeSubmission(submissionId: string) {
    const { error } = await supabase
      .from('submissions')
      .update({
        client_end_time: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (error) throw error
  }
}

export const assessmentService = new AssessmentService()
