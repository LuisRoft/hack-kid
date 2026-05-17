'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { APP_HOME, SIGN_IN_PATH } from '@/lib/auth-routes'
import type { CitizenProfile } from '@/lib/onboarding'

export type OnboardingActionState = {
  error?: string
}

function requiredString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function numberFromForm(formData: FormData, key: string): number {
  return Number(requiredString(formData, key))
}

function parseMedicalConditions(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function saveCitizenProfile(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    redirect(SIGN_IN_PATH)
  }

  const lat = numberFromForm(formData, 'lat')
  const lon = numberFromForm(formData, 'lon')
  const familySize = numberFromForm(formData, 'family_size')
  const locationLabel = requiredString(formData, 'location_label') || 'Casa'
  const alternateShelter = requiredString(formData, 'alternate_shelter')

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return {
      error:
        'No tenemos la ubicación de tu hogar. Usa el botón «Usar mi ubicación» e inténtalo de nuevo.',
    }
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return {
      error:
        'No tenemos la ubicación de tu hogar. Usa el botón «Usar mi ubicación» e inténtalo de nuevo.',
    }
  }

  if (!Number.isInteger(familySize) || familySize < 1 || familySize > 20) {
    return { error: 'Ingresa un tamaño familiar entre 1 y 20 personas.' }
  }

  const citizenProfile: CitizenProfile = {
    onboardingComplete: true,
    location: {
      lat,
      lon,
      label: locationLabel,
    },
    family_size: familySize,
    has_kids: formData.get('has_kids') === 'on',
    has_elderly: formData.get('has_elderly') === 'on',
    medical_conditions: parseMedicalConditions(requiredString(formData, 'medical_conditions')),
    has_vehicle: formData.get('has_vehicle') === 'on',
    alternate_shelter: null,
    alternate_shelter_label: alternateShelter || null,
    locale: 'es-EC',
  }

  const client = await clerkClient()

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      onboardingCompletedAt: new Date().toISOString(),
    },
    unsafeMetadata: {
      ...citizenProfile,
    },
  })

  redirect(APP_HOME)
}
