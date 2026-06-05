import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";
import type { Activity } from "../../types/activities.types";
import { useAllUsers } from "@/features/users/hooks/use-users";

interface CrmTimelineProps {
  activities: Activity[];
  emptyMessage?: string;
}

export function CrmTimeline({ activities, emptyMessage }: CrmTimelineProps) {
  const { t } = useTranslation("crm");
  const { data: users } = useAllUsers();

  if (!activities.length) {
    return <p className="text-default-500 text-sm">{emptyMessage ?? t("timeline.empty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {activities.map((a) => {
        const user = users?.find((u) => u.id === a.userId);
        return (
          <li
            key={a.id}
            className="flex gap-3 p-4 rounded-xl border border-default-100 bg-content1"
          >
            <div className="w-2 rounded-full bg-primary shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-sm">{a.subject}</p>
                <span className="text-[10px] uppercase font-bold text-default-400">
                  {t(`leadDetail.activities.types.${a.type}`, a.type)}
                </span>
              </div>
              {a.description && (
                <p className="text-sm text-default-600 mt-1 whitespace-pre-wrap">{a.description}</p>
              )}
              <p className="text-[10px] text-default-400 mt-2">
                {formatDate(a.occurredAt)}
                {user ? ` · ${user.name}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
