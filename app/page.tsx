import { HeroSection } from "./components/HeroSection";

export default function Home() {
  return (
    <main>
      {/* O import agora aponta corretamente para a pasta dentro de app */}
      <HeroSection />
    </main>
  );
}