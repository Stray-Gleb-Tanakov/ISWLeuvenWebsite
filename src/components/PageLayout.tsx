import { ReactNode } from "react";
import Scanlines from "./Scanlines";
import Footer from "./Footer";
import { useChanBan } from "@/hooks/UseChanBan";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

// Permanently hardware-banned by ISW-Chan (game/chanban.ts): every page reminds you
const BlacklistMark = () => {
  const { permanent } = useChanBan();
  if (!permanent) return null;
  return (
    <p className="pb-4 text-center text-xs font-mono text-red-400 isw-glitch" title="ISW-Chan never forgets.">
      ⛔ DEVICE BLACKLISTED BY ISW-CHAN · strike 4/3
    </p>
  );
};

const PageLayout = ({ children, showFooter = false }: PageLayoutProps) => (
  <div className="min-h-screen bg-background crt-flicker">
    <Scanlines />
    <main>{children}</main>
    {showFooter && <Footer />}
    <BlacklistMark />
  </div>
);

export default PageLayout;
