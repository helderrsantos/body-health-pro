import { supabase } from '@/lib/supabase'

export interface AccessData {
  email: string | null
  emailConfirmedAt: string | null
  createdAt: string | null
  lastSignInAt: string | null
  providers: string[]
}

export interface ProfileUpdateInput {
  nome: string
  email: string
}

export interface ProfileUpdateResult {
  emailUpdateRequiresConfirmation: boolean
}

function getAuthProviders(identities: Array<{ provider?: string | null }> | undefined) {
  if (!identities?.length) {
    return ['email']
  }

  const providers = identities
    .map((identity) => identity.provider?.trim().toLowerCase())
    .filter((provider): provider is string => Boolean(provider))

  return providers.length > 0 ? [...new Set(providers)] : ['email']
}

export async function getCurrentAccessData(): Promise<AccessData> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  return {
    email: user?.email ?? null,
    emailConfirmedAt: user?.email_confirmed_at ?? null,
    createdAt: user?.created_at ?? null,
    lastSignInAt: user?.last_sign_in_at ?? null,
    providers: getAuthProviders(user?.identities),
  }
}

export async function updateProfileData(input: ProfileUpdateInput): Promise<ProfileUpdateResult> {
  const normalizedName = input.nome.trim()
  const normalizedEmail = input.email.trim().toLowerCase()

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  if (getUserError) {
    throw new Error(getUserError.message)
  }

  if (!user?.id) {
    throw new Error('Usuario nao autenticado.')
  }

  const currentEmail = user.email?.trim().toLowerCase() ?? ''
  const shouldUpdateEmail = normalizedEmail !== currentEmail

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ nome: normalizedName })
    .eq('id', user.id)

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (shouldUpdateEmail) {
    const { error: authUpdateError } = await supabase.auth.updateUser({ email: normalizedEmail })

    if (authUpdateError) {
      throw new Error(authUpdateError.message)
    }
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: normalizedName,
    },
  })

  if (metadataError) {
    throw new Error(metadataError.message)
  }

  return {
    emailUpdateRequiresConfirmation: shouldUpdateEmail,
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    throw new Error(error.message)
  }
}