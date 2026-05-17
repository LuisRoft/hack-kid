import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { APP_HOME } from '@/lib/auth-routes';

type FinalizeNavigateArgs = {
  session: { currentTask?: { key: string } | null };
  decorateUrl: (path: string) => string;
};

export async function navigateAfterAuth(
  { session, decorateUrl }: FinalizeNavigateArgs,
  router: AppRouterInstance,
) {
  const destination = session.currentTask
    ? `/sign-in/tasks/${session.currentTask.key}`
    : APP_HOME;
  const url = decorateUrl(destination);

  if (url.startsWith('http')) {
    window.location.href = url;
    return;
  }

  router.push(url);
}
