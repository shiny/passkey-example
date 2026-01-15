import './globals.css';

export const metadata = {
  title: 'Passkey Demo',
  description: 'Minimal passkey demo with WebAuthn'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
