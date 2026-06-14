import { Card, CardBody } from "@heroui/react";
import { Umbrella, Thermometer, UserMinus, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LeaveBalanceCards() {
  const { t } = useTranslation("people");
  const balances = [
    { label: t("leave_tracker.annual_leave"), value: "15", total: "22", icon: <Umbrella size={24} />, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t("leave_tracker.sick_leave"), value: "4", total: "10", icon: <Thermometer size={24} />, color: "text-red-500", bg: "bg-red-500/10" },
    { label: t("leave_tracker.personal_leave"), value: "2", total: "5", icon: <UserMinus size={24} />, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: t("leave_tracker.pending_requests"), value: "1", total: null, icon: <Clock size={24} />, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((item) => (
        <Card key={item.label} className="border border-default-100 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-default-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{item.value}</span>
                {item.total && (
                  <span className="text-sm font-bold text-default-300">/ {item.total}</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
