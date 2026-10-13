import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Супара — панель управления (демо)",
  description: "Демо-версия платформы управления центром отдыха «Супара»: брони, гости, задачи, AI-агенты.",
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
    <html lang="ru" className={manrope.variable}>
      <body className="min-h-screen bg-ink font-sans antialiased">
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
