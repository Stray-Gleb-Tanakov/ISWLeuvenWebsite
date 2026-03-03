const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 px-4 border-t border-border">
      <div className="container-terminal text-center">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary">©</span> {currentYear} ISW Leuven v2.0.0
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          System Status: <span className="text-primary text-glow">ONLINE</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
