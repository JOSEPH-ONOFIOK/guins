import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Scene } from "@/components/Scene";
import { WaddleClaim } from "@/components/waddle/WaddleClaim";
import { WL_CAP } from "@/lib/waddle";

const DESC = `Hold a Pudgy Penguin, Lil Pudgy, Sappy Seal or an NFT from one of our partner communities? Claim one of ${WL_CAP.toLocaleString("en-US")} GTD Waddle List spots for the free Guins mint.`;
const SHARE = { url: "/og.png", width: 1200, height: 630, alt: "Guins: the Waddle List" };

export const metadata: Metadata = {
  title: "Waddle List · Community claim",
  description: DESC,
  alternates: { canonical: "/waddle" },
  openGraph: { type: "website", url: "/waddle", siteName: "Guins", title: "Waddle List · Guins", description: DESC, images: [SHARE] },
  twitter: { card: "summary_large_image", site: "@hoodguins", title: "Waddle List · Guins", description: DESC, images: [SHARE] },
};

export default function WaddlePage() {
  return (
    <>
      {/* No hero: straight to the claim */}
      <Scene calm />
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pt-28 sm:px-8 sm:pt-32">
        <WaddleClaim />
      </main>
      <Footer />
    </>
  );
}
