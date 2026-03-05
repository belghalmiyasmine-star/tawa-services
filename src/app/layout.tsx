import "./globals.css";

// Root layout — just imports globals.
// <html>, <body>, locale providers, theme, and session are in src/app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
