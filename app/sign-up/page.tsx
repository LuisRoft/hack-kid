import { RedirectIfSignedIn } from '@/components/auth/redirect-if-signed-in';
import { SignUpForm } from '@/components/auth/sign-up-form';

export default function SignUpPage() {
  return (
    <>
      <RedirectIfSignedIn />
      <SignUpForm />
    </>
  );
}
