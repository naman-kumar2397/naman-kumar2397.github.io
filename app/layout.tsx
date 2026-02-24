import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Fraunces } from "next/font/google";
import { ParticleBackground } from "@/components/ParticleBackground";
import "@/styles/tokens.css";
import "@/styles/global.css";
import "./animations.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-body",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Naman Kumar — Portfolio Flow Resume",
  description:
    "Interactive portfolio showcasing SRE and Cloud Engineering work as a data-driven flowchart.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${fraunces.variable}`}
      data-theme="system"
      suppressHydrationWarning
    >
      <body>
        <ParticleBackground />
        {children}
      </body>
    </html>
  );
}
