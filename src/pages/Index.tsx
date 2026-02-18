import PageLayout from "@/components/PageLayout";
import TerminalHero from "@/components/TerminalHero";
import CommandGrid from "@/components/CommandGrid";
import FloatingCodeWindows from "@/components/FloatingCodeWindows";

const Index = () => (
  <PageLayout showFooter>
     <FloatingCodeWindows />
    <TerminalHero />
    <CommandGrid />
  </PageLayout>
);

export default Index;
