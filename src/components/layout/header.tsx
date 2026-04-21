import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { useLayoutStore } from "@/stores/layout.store";
import { useThemeStore } from "@/stores/theme.store";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, LogOut, User } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();
  const { mode, toggleMode } = useThemeStore();

  const displayName =
    i18n.language === "ar" ? user?.nameAr : user?.name;
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Mobile menu trigger */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={i18n.language === "ar" ? "right" : "left"} className="w-60 p-0">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <Button variant="ghost" size="icon" onClick={toggleMode}>
          {mode === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline-block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="me-2 h-4 w-4" />
              {t("user.profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="me-2 h-4 w-4" />
              {t("user.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
