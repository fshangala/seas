'use server'

import { createClient } from '@/lib/supabase/server'
import { AssessmentService, BulkQuestion } from '@/lib/services/AssessmentService'
import { revalidatePath } from 'next/cache'

export async function bulkUploadQuestionsAction(assessmentId: string, jsonText: string) {
  const supabase = await createClient()
  const assessmentService = new AssessmentService(supabase)

  try {
    const questions: BulkQuestion[] = JSON.parse(jsonText)
    if (!Array.isArray(questions)) {
      return { error: 'Invalid format: Expected an array of questions' }
    }

    await assessmentService.addQuestionsBulk(assessmentId, questions)
    
    revalidatePath(`/examiner/assessments/${assessmentId}/edit`)
    return { success: true }
  } catch (err) {
    console.error('Bulk upload error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to parse JSON' }
  }
}
