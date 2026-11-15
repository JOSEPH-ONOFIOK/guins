import { Crew } from "@/components/Crew";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Lineup } from "@/components/Lineup";
import { Nav } from "@/components/Nav";
import { Ribbon } from "@/components/Ribbon";
import { Reveal } from "@/components/Reveal";
import { Scene } from "@/components/Scene";

export default function Home() {
  return (
    <>
      <Scene />
      <Nav />
      <main>
        <Hero />
        <Ribbon />
        <Lineup />
        <section id="colony" className="scroll-mt-20 pb-16 sm:pb-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-8">
            <Reveal><Crew /></Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
