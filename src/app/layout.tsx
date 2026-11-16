import type { Metadata, Viewport } from "next";
import { Fredoka, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { THEME_BOOT } from "@/lib/theme";
import { SmoothScroll } from "@/components/SmoothScroll";

// Fredoka for everything you read, JetBrains Mono for numbers
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

const TITLE = "Guins · The colony";
const DESCRIPTION = "The most unbothered little penguins on-chain. Join the whitelist, meet the gang and get ready for $RPENG.";
const SHARE = { url: "/og.png", width: 1200, height: 630, alt: "Guins: the most unbothered penguins on-chain" };

// Favicon and home-screen icons come from src/app/favicon.ico, icon.png and apple-icon.png
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Guins" },
  description: DESCRIPTION,
  applicationName: "Guins",
  keywords: ["Guins", "Hoodguins", "$RPENG", "penguin", "NFT", "PFP", "colony", "whitelist", "allowlist", "airdrop"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "Guins", locale: "en_US", title: TITLE, description: DESCRIPTION, images: [SHARE] },
  twitter: { card: "summary_large_image", site: "@hoodguins", creator: "@hoodguins", title: TITLE, description: DESCRIPTION, images: [SHARE] },
  appleWebApp: { title: "Guins", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0b0a12", colorScheme: "dark light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: THEME_BOOT may add data-light before React loads
    <html lang="en" data-scroll-behavior="smooth" className={`${fredoka.variable} ${mono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-dvh">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
