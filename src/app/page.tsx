import { Crew } from "@/components/Crew";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Lineup } from "@/components/Lineup";
import { Nav } from "@/components/Nav";
import { Ribbon } from "@/components/Ribbon";
import { Reveal } from "@/components/Reveal";
import { Scene } from "@/components/Scene";
import { Stash } from "@/components/Stash";

export default function Home() {
  return (
    <>
      <Scene />
      <Nav />
      <main>
        <Hero />
        <Ribbon />
        <Lineup />
        <section id="crew" className="scroll-mt-20 pb-16 sm:pb-24">
          <div className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 sm:px-8 lg:grid-cols-[1fr_1.35fr]">
            <Reveal className="flex [&>*]:flex-1"><Stash /></Reveal>
            <Reveal delay={100} className="flex [&>*]:flex-1"><Crew /></Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
