import { useMemo, useState } from "react";
import { Badge, Button } from "@heroui/react";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useMeetingsQuery } from "../hooks/use-meetings";
import { MeetingsDrawer } from "./MeetingsDrawer";
import { groupMeetings } from "../utils/meeting.utils";

/** Header entry point — available to every user on every screen. */
export function MeetingsNavButton() {
  const { t } = useTranslation("meetings");
  const [open, setOpen] = useState(false);
  const { data } = useMeetingsQuery();

  const todayCount = useMemo(() => {
    const meetings = (data?.data ?? []).filter((m) => m.status === "scheduled");
    return groupMeetings(meetings).today.length;
  }, [data]);

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="relative overflow-visible"
        aria-label={
          todayCount > 0 ? `${t("title")} (${todayCount})` : t("title")
        }
        aria-expanded={open}
        onPress={() => setOpen(true)}
      >
        <Badge
          color="primary"
          content={todayCount > 9 ? "9+" : todayCount}
          isInvisible={todayCount === 0}
          shape="circle"
        >
          <CalendarDays
            className={cn("h-5 w-5", open ? "text-primary" : "text-default-600")}
          />
        </Badge>
      </Button>
      <MeetingsDrawer isOpen={open} onOpenChange={setOpen} />
    </>
  );
}
