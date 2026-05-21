import type { Metadata } from "next";
import { Onest, Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const fontHeading = Onest({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * TODO (do this before launch, not before):
 *
 *   1. Replace `description` with a real 1-sentence product description (~150 chars).
 *   2. Add an Open Graph image at `public/opengraph-image.png` (1200x630) and a
 *      Twitter card image at `public/twitter-image.png` (1200x600). Recommended:
 *      generate from realfavicongenerator.net or use Next's file-based metadata
 *      (e.g. `src/app/opengraph-image.tsx`).
 *   3. Drop a `favicon.ico` / `icon.png` (32x32 or 512x512) and
 *      `apple-icon.png` (180x180) into `src/app/` — Next auto-wires them.
 *   4. Once you have a verified domain, add Google Search Console verification:
 *        verification: { google: "..." }
 */
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "crop-management", template: "%s | crop-management" },
  description: "TODO: write a 1-sentence product description.",
  openGraph: {
    title: "crop-management",
    description: "TODO: write a 1-sentence product description.",
    type: "website",
    url: APP_URL,
    siteName: "crop-management",
    // TODO: add /opengraph-image.png (1200x630) to public/ or src/app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "crop-management",
    description: "TODO: write a 1-sentence product description.",
    // TODO: add /twitter-image.png (1200x600) to public/ or src/app/twitter-image.tsx
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontHeading.variable} ${fontBody.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
