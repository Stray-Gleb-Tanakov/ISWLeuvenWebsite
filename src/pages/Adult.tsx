import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

type Step = "age" | "sure" | "upload" | "pawned";

const Adult = () => {
  const [step, setStep] = useState<Step>("age");
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleNo = () => navigate("/");

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        {step === "age" && (
          <div className="text-center animate-fade-in space-y-6">
            <h1 className="text-3xl font-mono text-primary text-glow">
              <span className="text-muted-foreground">$</span> sudo ./verify_age
            </h1>
            <p className="text-muted-foreground font-mono">Are you 18?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep("sure")}
                className="px-8 py-3 border border-primary text-primary font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Yes
              </button>
              <button
                onClick={handleNo}
                className="px-8 py-3 border border-border text-muted-foreground font-mono hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                No
              </button>
            </div>
          </div>
        )}

        {step === "sure" && (
          <div className="text-center animate-fade-in space-y-6">
            <h1 className="text-3xl font-mono text-primary text-glow">
              <span className="text-muted-foreground">$</span> confirm --really
            </h1>
            <p className="text-muted-foreground font-mono">Are you sure?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep("upload")}
                className="px-8 py-3 border border-primary text-primary font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Yes, I'm sure
              </button>
              <button
                onClick={handleNo}
                className="px-8 py-3 border border-border text-muted-foreground font-mono hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                No
              </button>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="text-center animate-fade-in space-y-6">
            <h1 className="text-3xl font-mono text-primary text-glow">
              <span className="text-muted-foreground">$</span> upload --id-document
            </h1>
            <p className="text-muted-foreground font-mono">
              Please upload a valid ID document to proceed.
            </p>
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              onChange={() => setStep("pawned")}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-8 py-3 border border-primary text-primary font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              📄 Upload Document
            </button>
          </div>
        )}

        {step === "pawned" && (
          <div className="text-center animate-fade-in">
            <h1
              className="text-5xl md:text-7xl font-mono font-bold text-primary text-glow"
              style={{ animation: "spin-text 2s linear infinite" }}
            >
              You've been Pawned 🐾
            </h1>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Adult;
