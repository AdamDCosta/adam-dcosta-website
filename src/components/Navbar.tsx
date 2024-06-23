import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { Github } from "lucide-react";

export default function Navbar({ className }: { className?: string }) {
  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-2">
        <NavigationMenuItem>
          <Button asChild variant="ghost">
            <a href="/">Home</a>
          </Button>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Button asChild variant="ghost">
            <a href="/projects">Projects</a>
          </Button>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Button asChild variant="ghost">
            <a href="/blogs">Blog</a>
          </Button>
        </NavigationMenuItem>
        <NavigationMenuItem></NavigationMenuItem>
        <Button size="icon" variant="ghost">
          <Github />
        </Button>
        <NavigationMenuItem>
          <ModeToggle />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
