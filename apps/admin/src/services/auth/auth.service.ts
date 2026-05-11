import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/auth'

interface ProfileRow {
  id: string
  nome: string
  role: UserProfile['role']
  tenant_id: string
}

export async function signUpAdmin(
  email: string,
  password: string,
  nomeAdmin: string,
  nomeTenant: string,
) {
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: nomeAdmin,
        company_name: nomeTenant,
      },
    },
  })

  if (signUpError) {
    if (signUpError.message === 'Database error saving new user') {
      throw new Error(
        'Erro de banco ao criar usuario. Aplique o hotfix SQL em packages/database/sql/hotfix_signup_500.sql no Supabase e tente novamente.',
      )
    }

    throw new Error(signUpError.message)
  }
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(error.message)
  }
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://body-health-pro-admin.vercel.app/auth/callback',
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function exchangeCodeForSession() {
  const code = new URL(globalThis.location.href).searchParams.get('code')

  if (!code) {
    throw new Error('Authorization code não encontrado na URL.')
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw new Error(error.message)
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message)
  }

  return data.session
}

async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,nome,role,tenant_id')
    .eq('id', userId)
    .single<ProfileRow>()

  if (error) {
    throw new Error(error.message)
  }

  const profile: UserProfile = {
    id: data.id,
    nome: data.nome,
    role: data.role,
    tenant_id: data.tenant_id,
  }

  return profile
}

export async function ensureProfileExists(userId: string): Promise<UserProfile> {
  try {
    return await getProfileByUserId(userId)
  } catch {
    const session = await getSession()
    if (!session?.user?.email) {
      throw new Error('Session not found')
    }

    const user = session.user
    const nomeAdmin = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
    const nomeTenant = user.user_metadata?.company_name || `Tenant ${user.id?.slice(0, 8)}`
    const { data, error } = await supabase.rpc('bootstrap_profile', {
      nome: nomeAdmin,
      empresa_nome: nomeTenant,
    })

    if (error) {
      throw new Error(`Failed to bootstrap profile: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create profile')
    }

    const result = data[0] as { profile_id: string; tenant_id: string }
    return {
      id: result.profile_id,
      nome: nomeAdmin,
      role: 'admin',
      tenant_id: result.tenant_id,
    }
  }
}

export function subscribeAuthChanges(onSessionChange: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSessionChange(session)
  })

  return () => {
    data.subscription.unsubscribe()
  }
}
