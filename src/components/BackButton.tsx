import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm group"
  >
    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
    <span>$ cd ..</span>
  </Link>
);

export default BackButton;
