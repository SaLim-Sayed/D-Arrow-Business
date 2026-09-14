import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { useLayoutStore } from "@/stores/layout.store";
import { useThemeStore } from "@/stores/theme.store";
import { LanguageSwitcher } from "./language-switcher";
import { NotificationsDropdown } from "./notifications-dropdown";
import { ChatNavButton } from "./chat-nav-button";
import { MeetingsNavButton } from "@/features/meetings/components/MeetingsNavButton";
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
  Tooltip,
} from "@heroui/react";
import { Menu, Moon, Sun, LogOut, User, Clock, Settings, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialsFromName, localizedName } from "@/lib/localized-name";
import { avatarSrc } from "@/lib/image-utils";
import { MobileSidebar } from "./mobile-sidebar";
import { Logo } from "../shared/logo";
import { useNavigate, useLocation } from "react-router-dom";
import { TimeTrackerWidget } from "@/features/people/components/TimeTrackerWidget";
import { useAttendanceTimer } from "@/features/people/hooks/use-attendance-timer";
import { getPortalFromPath } from "@/lib/portal-permissions";

export function Header({
  hasPortalSidebar = false,
  sidebarCollapsed = false,
}: {
  hasPortalSidebar?: boolean;
  sidebarCollapsed?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen, setPortalPickerOpen } = useLayoutStore();
  const { mode, toggleMode } = useThemeStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const portal = getPortalFromPath(pathname);
  const logoHomeTo =
    portal === "tasks" ||
    portal === "crm" ||
    portal === "people" ||
    portal === "billing" ||
    portal === "chat" ||
    portal === "settings"
      ? "/"
      : undefined;

  const { isCheckedIn, isOnBreak } = useAttendanceTimer();
  const displayName = localizedName(i18n.language, {
    name: user?.name,
    nameAr: user?.nameAr,
  });
  const initials = initialsFromName(displayName || user?.email || "", "U");

  return (
    <header
      className={cn(
        "fixed top-0 z-40 flex h-14 sm:h-16 items-center justify-between gap-1.5 sm:gap-3",
        "border-b border-default-100 glass px-2 sm:px-4 shadow-premium",
        "inset-x-0 transition-[inset] duration-300 max-w-full overflow-hidden",
        hasPortalSidebar &&
          (sidebarCollapsed
            ? "md:inset-x-auto md:start-[5.5rem] md:end-0"
            : "md:inset-x-auto md:start-64 md:end-0")
      )}
    >
      {/* Start side controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* System / Portal Picker button */}
        <Tooltip content={t("portals.switchPortal", "اختر النظام")}>
          <Button
            isIconOnly
            variant="flat"
            color="primary"
            size="sm"
            onPress={() => setPortalPickerOpen(true)}
            aria-label={t("portals.switchPortal", "اختر النظام")}
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 min-w-0 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold"
          >
            <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Tooltip>

        {/* Mobile menu trigger */}
        {hasPortalSidebar && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="md:hidden shrink-0 h-8 w-8 min-w-0"
            onPress={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {hasPortalSidebar && (
          <Drawer
            isOpen={mobileSidebarOpen}
            onOpenChange={setMobileSidebarOpen}
            placement={i18n.dir() === "rtl" ? "right" : "left"}
            className="bg-background/80 backdrop-blur-xl"
          >
            <DrawerContent>
              <MobileSidebar />
            </DrawerContent>
          </Drawer>
        )}

        <Logo
          size="sm"
          variant="icon"
          to={logoHomeTo}
          title={t("portals.allApps")}
          className={cn(
            "shrink-0",
            hasPortalSidebar ? "flex md:hidden" : "flex"
          )}
        />
      </div>

      {/* End side actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
        <div className="block sm:hidden shrink-0">
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className={`min-w-0 w-8 h-8 ${
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
                  className={`w-3.5 h-3.5 ${isCheckedIn && !isOnBreak ? "animate-pulse" : ""}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none glass-card shadow-premium">
              <TimeTrackerWidget />
            </PopoverContent>
          </Popover>
        </div>

        <div className="hidden sm:block mr-0 sm:mr-1 shrink-0">
          <TimeTrackerWidget />
        </div>

        <div className="shrink-0"><MeetingsNavButton /></div>
        <div className="shrink-0"><ChatNavButton /></div>
        <div className="shrink-0"><NotificationsDropdown /></div>
        <div className="shrink-0"><LanguageSwitcher compact className="sm:hidden" /></div>
        <div className="shrink-0"><LanguageSwitcher className="hidden sm:flex" /></div>

        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={toggleMode}
          className="bg-default-100/50 hover:bg-default-200/50 min-w-0 w-8 h-8 sm:w-9 sm:h-9 shrink-0"
        >
          {mode === "dark" ? (
            <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />
          ) : (
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          )}
        </Button>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="flex items-center gap-1.5 cursor-pointer p-0.5 sm:p-1 rounded-full hover:bg-default-100/50 transition-colors shrink-0">
              <Avatar
                size="sm"
                src={avatarSrc(user?.avatar)}
                fallback={initials}
                showFallback
                className="h-8 w-8 sm:h-9 sm:w-9 text-xs ring-2 ring-primary/20 shrink-0"
              />
              <span className="hidden text-xs sm:text-sm font-semibold lg:inline-block pr-1 max-w-[100px] truncate">
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
              key="settings"
              startContent={<Settings className="h-4 w-4" />}
              onPress={() => navigate("/settings/company")}
            >
              {t("user.settings")}
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
