import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { useLayoutStore } from "@/stores/layout.store";
import { useThemeStore } from "@/stores/theme.store";
import { LanguageSwitcher } from "./language-switcher";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Drawer, DrawerContent } from "@heroui/react";
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-default-100 glass px-4 shadow-premium">
      {/* Mobile menu trigger */}
      <Button
        isIconOnly
        variant="light"
        className="md:hidden"
        onPress={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Drawer
        isOpen={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        placement={i18n.language === "ar" ? "right" : "left"}
        className="bg-background/80 backdrop-blur-xl"
      >
        <DrawerContent>
          <MobileSidebar />
        </DrawerContent>
      </Drawer>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <Button 
          isIconOnly 
          variant="flat" 
          onPress={toggleMode}
          className="bg-default-100/50 hover:bg-default-200/50"
        >
          {mode === "dark" ? (
            <Sun className="h-4 w-4 text-warning" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </Button>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-default-100/50 transition-colors">
              <Avatar 
                size="sm" 
                src={user?.avatar} 
                fallback={initials} 
                showFallback
                className="ring-2 ring-primary/20"
              />
              <span className="hidden text-sm font-semibold sm:inline-block pr-2">
                {displayName}
              </span>
            </div>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            <DropdownItem key="profile" startContent={<User className="h-4 w-4" />}>
              {t("user.profile")}
            </DropdownItem>
            <DropdownItem 
              key="logout" 
              className="text-danger" 
              color="danger"
              onPress={logout}
              startContent={<LogOut className="h-4 w-4" />}
            >
              {t("user.logout")}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
}
