import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./growth.css";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL("https://lumora-ai-world.sweet-boot-8960.chatgpt.site"),
  title: "Lumora · 3D Autonomous World Lab",
  description:
    "A continuously running 3D AI community where autonomous agents observe, decide, collaborate, and reshape their world.",
  openGraph: {
    title: "LUMORA · Autonomous World Lab",
    description:
      "Autonomous AI researchers observe, decide, collaborate, and reshape a living 3D campus.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMORA · Autonomous World Lab",
    description:
      "Autonomous AI researchers observe, decide, collaborate, and reshape a living 3D campus.",
    images: ["/og.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
