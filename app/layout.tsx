import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Fraunces } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { DoodleBackground } from "@/components/DoodleBackground";
import "@/styles/tokens.css";
import "@/styles/global.css";
import "./animations.css";

const SITE_URL = "https://naman-kumar2397.github.io";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-display",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Naman Kumar — Lead Site Reliability Engineer",
    template: "%s | Naman Kumar",
  },
  description:
    "Portfolio of Naman Kumar — Lead SRE based in Melbourne, Australia. Specialising in Kubernetes, cloud reliability, observability, and platform engineering.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Naman Kumar Portfolio",
    title: "Naman Kumar — Lead Site Reliability Engineer",
    description:
      "Interactive portfolio of Naman Kumar — Lead SRE in Melbourne. Kubernetes, cloud reliability, observability, platform engineering.",
    images: [
      {
        url: "/profile.jpeg",
        width: 800,
        height: 800,
        alt: "Naman Kumar — Lead Site Reliability Engineer",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Naman Kumar — Lead Site Reliability Engineer",
    description:
      "Interactive portfolio of Naman Kumar — Lead SRE in Melbourne. Kubernetes, cloud reliability, observability, platform engineering.",
    images: ["/profile.jpeg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}
      data-theme="system"
      suppressHydrationWarning
    >
      <body>
        <DoodleBackground />
        {children}
      </body>
    </html>
  );
}
