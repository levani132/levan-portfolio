import Navigation from "@/components/Navigation";
import CosmicBackground from "@/components/CosmicBackground";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Education from "@/components/Education";
import Footer from "@/components/Footer";
import GlassFX from "@/components/GlassFX";
import ScrollProgress from "@/components/ScrollProgress";
import TerminalTheme from "@/themes/terminal/TerminalTheme";
import EditorialTheme from "@/themes/editorial/EditorialTheme";

/**
 * The site ships three complete, visually unrelated designs. Pick one at
 * build time via NEXT_PUBLIC_THEME:
 *
 *   cosmic    (default) — liquid glass + morphing WebGL particle cosmos
 *   terminal             — interactive retro CRT shell ("levan_os")
 *   editorial            — brutalist ink & acid typography
 */
const THEME = process.env.NEXT_PUBLIC_THEME ?? "cosmic";

export default function Home() {
  if (THEME === "terminal") return <TerminalTheme />;
  if (THEME === "editorial") return <EditorialTheme />;

  return (
    <div className="relative min-h-screen bg-white dark:bg-black">
      {/* 3D cosmic background — fixed, sits behind everything */}
      <CosmicBackground />

      {/* Film grain over the cosmos, under the content */}
      <div className="grain" aria-hidden />

      {/* Pointer-tracked specular highlights on all glass surfaces */}
      <GlassFX />

      {/* Aurora scroll progress bar */}
      <ScrollProgress />

      {/* All content above the cosmos */}
      <div className="relative z-10">
        <Navigation />
        <main>
          <Hero />
          <About />
          <Experience />
          <Skills />
          <Projects />
          <Education />
        </main>
        <Footer />
      </div>
    </div>
  );
}
