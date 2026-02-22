// Root layout — minimal pass-through.
// The full layout (html, body, fonts, ThemeProvider) is in src/app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
