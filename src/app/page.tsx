import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { Lineup } from "@/components/Lineup";
import { Nav } from "@/components/Nav";
import { Ribbon } from "@/components/Ribbon";
import { Scene } from "@/components/Scene";

export default function Home() {
  return (
    <>
      <Scene />
      <Nav />
      <main>
        <Intro cta={{ label: "Get a Guin", href: "#apply" }} />
        <Hero />
        <Ribbon />
        <Lineup />
      </main>
      <Footer />
    </>
  );
}
