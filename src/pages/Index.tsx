import PageLayout from "@/components/PageLayout";
import TerminalHero from "@/components/TerminalHero";
import CommandGrid from "@/components/CommandGrid";
import FloatingCodeWindows from "@/components/FloatingCodeWindows";
import SponsorsSection from "@/components/SponsorSection";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useKonamiCode } from "@/hooks/UseKonamiCode";

const Index = () => {
  const navigate = useNavigate();
  useKonamiCode(useCallback(() => navigate("/game"), [navigate]));
  return (
    <PageLayout showFooter>
      <FloatingCodeWindows />
      <TerminalHero />
      <CommandGrid />
      <SponsorsSection />
    </PageLayout>
  );
};

export default Index;
