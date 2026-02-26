import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import catgirl1 from "@/assets/catgirl-1.png";
import catgirl2 from "@/assets/catgirl-2.png";

const Catgirls = () => (
  <PageLayout>
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-12">
      <BackButton />
      <h1 className="text-2xl font-mono text-primary text-glow">
        <span className="text-muted-foreground">$</span> cat ~/catgirls/*
      </h1>
      <img src={catgirl1} alt="A-10 catgirl goes brrrt" className="max-w-lg w-full rounded border border-border" />
      <img src={catgirl2} alt="Genetically engineered catgirls" className="max-w-lg w-full rounded border border-border" />
    </div>
  </PageLayout>
);

export default Catgirls;
