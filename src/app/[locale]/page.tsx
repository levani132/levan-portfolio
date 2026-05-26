import Navigation from "@/components/Navigation";
import CosmicBackground from "@/components/CosmicBackground";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Education from "@/components/Education";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-black">
      {/* 3D cosmic background — fixed, sits behind everything */}
      <CosmicBackground />

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
