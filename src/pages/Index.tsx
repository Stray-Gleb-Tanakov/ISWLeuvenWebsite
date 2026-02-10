import PageLayout from "@/components/PageLayout";
import TerminalHero from "@/components/TerminalHero";
import CommandGrid from "@/components/CommandGrid";

const Index = () => (
  <PageLayout showFooter>
    <TerminalHero />
    <CommandGrid />
  </PageLayout>
);

export default Index;
