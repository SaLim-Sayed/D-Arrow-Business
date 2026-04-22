import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { useLayoutStore } from "@/stores/layout.store";
import { useThemeStore } from "@/stores/theme.store";
import { LanguageSwitcher } from "./language-switcher";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
} from "@heroui/react";
import { Menu, Moon, Sun, LogOut, User } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();
  const { mode, toggleMode } = useThemeStore();

  const displayName = i18n.language === "ar" ? user?.nameAr : user?.name;
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Mobile menu trigger */}
      <Button
        isIconOnly
        variant="outline"
        className="md:hidden"
        onPress={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <DrawerRoot
        isOpen={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      >
        <DrawerBackdrop>
          <DrawerContent placement={i18n.language === "ar" ? "right" : "left"}>
            <DrawerDialog>
              <MobileSidebar />
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </DrawerRoot>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <Button isIconOnly variant="primary" onPress={toggleMode}>
          {mode === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Dropdown>
          <DropdownTrigger>
            <Button variant="primary" className="gap-2 px-2 h-9 min-w-0">
              <Avatar size="sm">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline-block">
                {displayName}
              </span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions">
            <DropdownItem key="profile">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("user.profile")}
              </div>
            </DropdownItem>
            <DropdownItem key="logout" className="text-danger" onPress={logout}>
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                {t("user.logout")}
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
}
