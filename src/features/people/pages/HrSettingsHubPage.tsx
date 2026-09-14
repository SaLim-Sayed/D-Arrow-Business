import { useState } from "react";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { Users, ShieldCheck, MapPin, Building2, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TeamMembersPage } from "@/features/companies/pages/TeamMembersPage";
import { RolesPermissionsPage } from "@/features/companies/pages/RolesPermissionsPage";
import { CompanySettingsPage } from "@/features/companies/pages/CompanySettingsPage";
import AttendanceSettingsPage from "./AttendanceSettingsPage";

export default function HrSettingsHubPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [selectedTab, setSelectedTab] = useState<string>("team");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 shadow-sm">
            <Sliders size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {isAr ? "إعدادات الفريق والأدوار والنظام" : "Team, Roles & System Settings"}
            </h1>
            <p className="text-xs text-default-500 font-medium mt-0.5">
              {isAr 
                ? "إدارة أعضاء الفريق، تفعيل الأدوار، الصلاحيات، مواقع الحضور والبصمة، وبيانات الشركة من مكان واحد"
                : "Manage team members, roles & permissions, work locations & company settings in one place."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Tabs */}
      <Card className="border border-default-100 shadow-xl rounded-3xl overflow-hidden bg-background">
        <CardBody className="p-4 sm:p-6">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(String(key))}
            variant="solid"
            color="primary"
            radius="full"
            size="lg"
            classNames={{
              tabList: "w-full overflow-x-auto scrollbar-hide flex-wrap sm:flex-nowrap gap-2 p-1.5 bg-default-100/70 dark:bg-default-50/20 rounded-2xl border border-default-200/50",
              tab: "h-11 rounded-xl font-bold text-sm transition-all text-default-600 data-[selected=true]:text-primary-foreground data-[selected=true]:font-black shadow-none",
              tabContent: "font-bold flex items-center gap-2 px-1",
            }}
          >
            <Tab
              key="team"
              title={
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>{isAr ? "أعضاء الفريق والدعوات" : "Team Members & Invites"}</span>
                </div>
              }
            >
              <div className="pt-4">
                <TeamMembersPage />
              </div>
            </Tab>

            <Tab
              key="roles"
              title={
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} />
                  <span>{isAr ? "الأدوار والصلاحيات" : "Roles & Permissions"}</span>
                </div>
              }
            >
              <div className="pt-4">
                <RolesPermissionsPage />
              </div>
            </Tab>

            <Tab
              key="locations"
              title={
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>{isAr ? "مواقع الحضور والبصمة" : "Work Locations & Geofence"}</span>
                </div>
              }
            >
              <div className="pt-4">
                <AttendanceSettingsPage />
              </div>
            </Tab>

            <Tab
              key="company"
              title={
                <div className="flex items-center gap-2">
                  <Building2 size={18} />
                  <span>{isAr ? "إعدادات وبيانات الشركة" : "Company Profile"}</span>
                </div>
              }
            >
              <div className="pt-4">
                <CompanySettingsPage />
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
