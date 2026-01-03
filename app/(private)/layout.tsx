export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full max-w-6xl mx-auto flex-col">
      {children}
    </main>
  );
}

