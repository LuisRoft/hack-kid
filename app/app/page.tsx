import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SIGN_IN_PATH } from '@/lib/auth-routes'
import { AppShell } from '@/components/app/app-shell'

export default async function AppPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) {
    redirect(SIGN_IN_PATH)
  }

  return <AppShell />
}
