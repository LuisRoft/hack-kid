export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className='h-dvh overflow-hidden'>{children}</div>;
}
