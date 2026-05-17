import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { CitizenProfile } from '@/lib/onboarding'

type CitizenProfilePayload = Partial<CitizenProfile> & {
  location?: Partial<CitizenProfile['location']>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getCitizenProfile(value: unknown): CitizenProfile | null {
  if (!isRecord(value)) return null
  const profile = value.profile ?? value.citizen_profile

  if (isRecord(profile)) return profile as CitizenProfile

  if (isRecord(value.location) && 'family_size' in value) {
    return value as CitizenProfile
  }

  return null
}

function normalizeProfile(payload: CitizenProfilePayload): CitizenProfile | null {
  const lat = Number(payload.location?.lat)
  const lon = Number(payload.location?.lon)
  const familySize = Number(payload.family_size)

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null
  if (!Number.isInteger(familySize) || familySize < 1 || familySize > 20) return null

  return {
    onboardingComplete: true,
    location: {
      lat,
      lon,
      label: String(payload.location?.label || 'Casa').trim() || 'Casa',
    },
    family_size: familySize,
    has_kids: payload.has_kids === true,
    has_elderly: payload.has_elderly === true,
    medical_conditions: Array.isArray(payload.medical_conditions)
      ? payload.medical_conditions.map(String).map((item) => item.trim()).filter(Boolean)
      : [],
    has_vehicle: payload.has_vehicle === true,
    alternate_shelter: null,
    alternate_shelter_label:
      typeof payload.alternate_shelter_label === 'string'
        ? payload.alternate_shelter_label.trim() || null
        : null,
    locale: 'es-EC',
  }
}

export async function GET() {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  return NextResponse.json({
    profile:
      getCitizenProfile(user.unsafeMetadata) ??
      getCitizenProfile(user.privateMetadata),
  })
}

export async function PUT(request: Request) {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const profile = normalizeProfile(payload)

  if (!profile) {
    return NextResponse.json({ error: 'Perfil ciudadano inválido.' }, { status: 400 })
  }

  const client = await clerkClient()

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      onboardingCompletedAt: new Date().toISOString(),
    },
    unsafeMetadata: {
      ...profile,
    },
  })

  return NextResponse.json({ profile })
}
