import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { AdminPanel } from "./AdminPanel";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[100svh] max-w-2xl px-4 pt-32 pb-20 sm:px-8">
        <p className="label label-accent">Colony admin</p>
        <h1 className="mt-3 font-display text-5xl leading-none font-bold uppercase">
          Post links<span className="text-accent">.</span>
        </h1>
        <p className="mt-4 text-dim">Change the posts the whitelist and airdrop steps point at. It goes live straight away, no redeploy.</p>
        <AdminPanel />
      </main>
      <Footer />
    </>
  );
}
