

import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { HeaderBase } from "./header-base";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const leftContent = (
    <Link to="/" className="flex items-center gap-3">
      <img
        src="/logo.svg"
        alt="OpenCut Logo"
        className="invert dark:invert-0"
        width={32}
        height={32}
      />
      <span className="text-xl font-medium hidden md:block">OpenCut</span>
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-2">
      <div className="flex items-center gap-4">
        <Link to="/blog">
          <Button variant="ghost" className="text-sm p-0">
            Blog
          </Button>
        </Link>
        <Link to="/contributors">
          <Button variant="ghost" className="text-sm p-0">
            Contributors
          </Button>
        </Link>
      </div>
      <Link to="/projects">
        <Button size="sm" className="text-sm ml-2">
          Projects
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <ThemeToggle className="mr-2" />
    </nav>
  );

  return (
    <div className="sticky top-4 z-50 mx-4 md:mx-0">
      <HeaderBase
        className="bg-background border rounded-2xl max-w-3xl mx-auto mt-4 pl-4 pr-[11px]"
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
