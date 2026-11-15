import type { Metadata, Viewport } from "next";
import { Fredoka, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

// Fredoka for everything you read, JetBrains Mono for numbers
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

const TITLE = "Guins";
const DESCRIPTION = "The most unbothered little penguins on-chain. Meet the gang, flip some $RPENG and join the colony.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Guins" },
  description: DESCRIPTION,
  applicationName: TITLE,
  keywords: ["Guins", "$RPENG", "penguin", "NFT", "PFP", "colony", "allowlist"],
  openGraph: { type: "website", url: "/", siteName: TITLE, title: TITLE, description: DESCRIPTION, images: ["/hg/boss.jpg"] },
  twitter: { card: "summary_large_image", site: "@hoodguins", creator: "@hoodguins", title: TITLE, description: DESCRIPTION, images: ["/hg/boss.jpg"] },
};

export const viewport: Viewport = { themeColor: "#f3f1ff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fredoka.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
