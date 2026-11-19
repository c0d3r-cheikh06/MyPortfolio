import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CHEIKH.EXE — BEYOND THE CODE | Cheikh Thiam 3D Developer Universe",
  description:
    "Portfolio 3D immersif et interactif de Cheikh Thiam (C0D3R-CHEIKH06) : hologramme 3D reconstruit par lasers, laboratoire informatique futuriste, ciel astronomique jour/nuit, projets GitHub vérifiés, univers de compétences et hobbies.",
  authors: [{ name: "Cheikh Thiam", url: "https://github.com/c0d3r-cheikh06" }],
  openGraph: {
    title: "CHEIKH.EXE — BEYOND THE CODE",
    description:
      "Expérience 3D WebGL interactive : laboratoire futuriste, hologramme laser, projets GitHub et univers personnel de Cheikh Thiam.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04070B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#04070B] text-[#ECF3F7] font-sans selection:bg-[#4EF2B8]/25 selection:text-[#ECF3F7] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
