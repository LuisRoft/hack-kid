export type CitizenProfile = {
  onboardingComplete: boolean
  onboarding_complete?: boolean
  location: {
    lat: number
    lon: number
    label: string
  }
  family_size: number
  has_kids: boolean
  has_elderly: boolean
  medical_conditions: string[]
  has_vehicle: boolean
  alternate_shelter: {
    lat: number
    lon: number
    label: string
  } | null
  alternate_shelter_label?: string | null
  locale?: string
}

type MetadataLike = Record<string, unknown> | null | undefined

export function hasCompletedOnboarding(
  publicMetadata: MetadataLike,
  unsafeMetadata?: MetadataLike,
): boolean {
  const profile =
    typeof unsafeMetadata?.profile === 'object' && unsafeMetadata.profile !== null
      ? (unsafeMetadata.profile as Record<string, unknown>)
      : null

  return (
    publicMetadata?.onboardingComplete === true ||
    unsafeMetadata?.onboardingComplete === true ||
    unsafeMetadata?.onboarding_complete === true ||
    profile?.onboardingComplete === true ||
    profile?.onboarding_complete === true
  )
}
