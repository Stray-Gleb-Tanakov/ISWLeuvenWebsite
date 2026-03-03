import PageLayout from "@/components/PageLayout";
import TerminalHero from "@/components/TerminalHero";
import CommandGrid from "@/components/CommandGrid";
import FloatingCodeWindows from "@/components/FloatingCodeWindows";
import SponsorsSection from "@/components/SponsorSection";

const Index = () => (
  <PageLayout showFooter>
     <FloatingCodeWindows />
    <TerminalHero />
    <CommandGrid />
    <SponsorsSection />
  </PageLayout>
);

export default Index;
