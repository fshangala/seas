'use server'

import { createClient } from '@/lib/supabase/server'

interface AuthState {
  success: boolean
  role?: "admin" | "examiner" | null
  error: string | null
}

export async function signIn(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error: error.message,
      success: false,
      role: null
    }
  }

  // Fetch user role to determine redirect path
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  return { 
    success: true, 
    role: profile?.role,
    error: null
  }
}

export async function signUp(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const supabase = await createClient()

  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return { error: authError.message, success: false, role: null }
  }

  if (data.user) {
    // Insert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: data.user.id, 
          full_name: fullName, 
          role: 'examiner' 
        }
      ])

    if (profileError) {
      return { error: profileError.message, success: false, role: null }
    }
  }

  return { success: true, role: null, error: null }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true, role: null, error: null }
}
