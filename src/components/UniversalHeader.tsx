import { Settings, User, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { authService } from "@/services/authService";
// Map routes to titles
const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/inbox": "Inbox",
  "/opd": "OPD",
};

export const UniversalHeader = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const pageTitle = routeTitles[location.pathname] || "Chat App";

  const handleLogout = () => {
    logout();
  };

  const handleThemeToggle = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    console.log('🎨 Theme toggle:', { current: resolvedTheme, new: newTheme });

    // Set theme in next-themes
    setTheme(newTheme);

    // Save to user preferences
    authService.updateUserPreferences({ theme: newTheme });
  };

  return (
    <header className="h-16 border-b border-border bg-background px-4 md:px-6 flex items-center justify-between">
      {/* Left Side - Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary w-10 h-10 flex items-center justify-center text-primary-foreground font-bold text-lg">
          C
        </div>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>

      {/* Right Side - Settings and Profile */}
      <div className="flex items-center gap-2">
        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Settings"
        >
          <Settings size={20} className="text-muted-foreground" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Toggle theme"
          onClick={handleThemeToggle}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full px-3"
            >
              
              <span className="hidden md:inline text-sm">
                {user?.email}
              </span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.email} 
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};