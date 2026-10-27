import { ReactNode } from "react";
import Scanlines from "./Scanlines";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const PageLayout = ({ children, showFooter = false }: PageLayoutProps) => (
  <div className="min-h-screen bg-background crt-flicker">
    <Scanlines />
    <main>{children}</main>
    {showFooter && <Footer />}
  </div>
);

export default PageLayout;
