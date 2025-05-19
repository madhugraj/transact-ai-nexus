
import { Copyright } from "lucide-react";

const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-4 mt-auto">
      <div className="container flex items-center justify-center text-sm text-muted-foreground">
        <Copyright className="mr-2 h-4 w-4" />
        <span>Copyright © {currentYear} yavar Techworks Pte Ltd., All rights reserved</span>
      </div>
    </footer>
  );
};

export default AppFooter;
