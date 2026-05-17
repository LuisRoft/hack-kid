import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ONBOARDING_PATH, SIGN_IN_PATH } from '@/lib/auth-routes'
import { AppShell } from '@/components/app/app-shell'
import { hasCompletedOnboarding } from '@/lib/onboarding'

export default async function AppPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) {
    redirect(SIGN_IN_PATH)
  }

  const user = await currentUser()

  if (!hasCompletedOnboarding(user?.publicMetadata, user?.unsafeMetadata)) {
    redirect(ONBOARDING_PATH)
  }

  return <AppShell />
}
