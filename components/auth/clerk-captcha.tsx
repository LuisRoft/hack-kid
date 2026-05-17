/**
 * Required for Clerk bot protection in custom auth flows.
 * @see https://clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection
 */
export function ClerkCaptcha() {
  return (
    <div
      id='clerk-captcha'
      data-cl-theme='light'
      data-cl-size='flexible'
      className='empty:hidden'
    />
  );
}
