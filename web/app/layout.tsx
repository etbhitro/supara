import type { Metadata, Viewport } from "next";
import { Cormorant, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

// Заголовки лендинга: антиква с кириллицей.
const display = Cormorant({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Супара — цифровой управляющий",
  description: "Платформа управления центром отдыха «Супара»: AI-агенты читают Битрикс24, брони и кассу, присылают сводку и советы владельцу.",
  // Демо с вымышленными данными: в поиск не отдаём.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1A130E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${display.variable}`}>
      <body className="min-h-screen bg-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
