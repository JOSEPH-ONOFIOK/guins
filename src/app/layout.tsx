import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });

const TITLE = "Hoodguins";
const DESCRIPTION = "Sleepy, grumpy, secretly soft. The most unbothered little penguins on the block. Meet the gang, flip some $RPENG and join the crew.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Hoodguins" },
  description: DESCRIPTION,
  applicationName: TITLE,
  keywords: ["Hoodguins", "$RPENG", "penguin", "NFT", "PFP", "crew", "allowlist"],
  openGraph: { type: "website", url: "/", siteName: TITLE, title: TITLE, description: DESCRIPTION, images: ["/hg/boss.jpg"] },
  twitter: { card: "summary_large_image", site: "@hoodguins", creator: "@hoodguins", title: TITLE, description: DESCRIPTION, images: ["/hg/boss.jpg"] },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
