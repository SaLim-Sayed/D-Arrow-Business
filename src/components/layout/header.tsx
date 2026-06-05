import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { useLayoutStore } from "@/stores/layout.store";
import { useThemeStore } from "@/stores/theme.store";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationsDropdown } from "./notifications-dropdown";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Drawer,
  DrawerContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Menu, Moon, Sun, LogOut, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileSidebar } from "./mobile-sidebar";
import { Logo } from "../shared/logo";
import { useNavigate } from "react-router-dom";
import { TimeTrackerWidget } from "@/features/people/components/TimeTrackerWidget";
import { useAttendanceTimer } from "@/features/people/hooks/use-attendance-timer";

export function Header({
  hasPortalSidebar = false,
  sidebarCollapsed = false,
}: {
  hasPortalSidebar?: boolean;
  sidebarCollapsed?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();
  const { mode, toggleMode } = useThemeStore();
  const navigate = useNavigate();

  const { isCheckedIn, isOnBreak } = useAttendanceTimer();
  const displayName = i18n.language === "ar" ? user?.nameAr : user?.name;
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "fixed top-0 z-40 flex h-14 sm:h-16 items-center gap-2 sm:gap-4",
        "border-b border-default-100 glass px-3 sm:px-4 shadow-premium",
        "inset-x-0 transition-[inset] duration-300",
        hasPortalSidebar &&
          (sidebarCollapsed
            ? "md:inset-x-auto md:start-20 md:end-0"
            : "md:inset-x-auto md:start-64 md:end-0")
      )}
    >
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

      <Logo
        size="sm"
        variant="icon"
        className={cn(
          "shrink-0",
          hasPortalSidebar ? "flex md:hidden" : "flex"
        )}
      />

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-0.5 sm:gap-3 min-w-0">
        <div className="block sm:hidden shrink-0">
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className={`min-w-0 w-9 h-9 ${
                  isCheckedIn && !isOnBreak
                    ? "bg-success/10 text-success"
                    : isOnBreak && isCheckedIn
                      ? "bg-warning/10 text-warning"
                      : !isCheckedIn &&
                        !isOnBreak &&
                        "bg-default/10 text-primary"
                }`}
              >
                <Clock
                  className={`w-4 h-4 ${isCheckedIn && !isOnBreak ? "animate-pulse" : ""}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none glass-card shadow-premium">
              <TimeTrackerWidget />
            </PopoverContent>
          </Popover>
        </div>
        <div className="hidden sm:block mr-0 sm:mr-2">
          <TimeTrackerWidget />
        </div>
        <NotificationsDropdown />
        <LanguageSwitcher compact className="sm:hidden" />
        <LanguageSwitcher className="hidden sm:flex" />

        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={toggleMode}
          className="bg-default-100/50 hover:bg-default-200/50 min-w-9 h-9"
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
            <DropdownItem
              key="profile"
              startContent={<User className="h-4 w-4" />}
              onPress={() => navigate("/profile")}
            >
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
