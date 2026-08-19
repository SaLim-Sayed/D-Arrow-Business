import { useMemo, useState } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMeetingsQuery } from "../hooks/use-meetings";
import { MeetingFormModal } from "./MeetingFormModal";
import {
  buildMonthGrid,
  formatMeetingTimeRange,
  isSameDay,
  meetingColor,
  meetingsOnDay,
} from "../utils/meeting.utils";
import type { Meeting } from "../types/meeting.types";

interface MeetingsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function MiniCalendar({
  month,
  selected,
  meetings,
  locale,
  onSelect,
  onMonthChange,
}: {
  month: Date;
  selected: Date;
  meetings: Meeting[];
  locale: string;
  onSelect: (day: Date) => void;
  onMonthChange: (month: Date) => void;
}) {
  const today = new Date();
  const days = useMemo(
    () => buildMonthGrid(month.getFullYear(), month.getMonth()),
    [month]
  );
  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    // 2024-01-07 is a Sunday — the first column of the grid.
    return Array.from({ length: 7 }, (_, i) =>
      formatter.format(new Date(2024, 0, 7 + i))
    );
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(month);

  const shiftMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-default-800">{monthLabel}</p>
        <div className="flex items-center gap-0.5">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={monthLabel}
            onPress={() => shiftMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={monthLabel}
            onPress={() => shiftMonth(1)}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {weekdays.map((label, i) => (
          <span
            key={i}
            className="text-center text-[11px] font-medium text-default-400"
          >
            {label}
          </span>
        ))}

        {days.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selected);
          const count = meetingsOnDay(meetings, day).length;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className="flex flex-col items-center gap-0.5 py-0.5"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors",
                  !inMonth && "text-default-300",
                  inMonth && "text-default-700 hover:bg-default-100",
                  isToday && !isSelected && "font-bold text-primary",
                  isSelected && "bg-primary font-bold text-white hover:bg-primary"
                )}
              >
                {day.getDate()}
              </span>
              <span className="flex h-1 items-center gap-0.5">
                {count > 0 &&
                  Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-primary" : "bg-default-400"
                      )}
                    />
                  ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaItem({
  meeting,
  locale,
  onOpen,
}: {
  meeting: Meeting;
  locale: string;
  onOpen: (meeting: Meeting) => void;
}) {
  const { t } = useTranslation("meetings");
  const color = meetingColor(meeting);

  return (
    <button
      type="button"
      onClick={() => onOpen(meeting)}
      className="flex w-full gap-3 rounded-lg p-2 text-start transition-colors hover:bg-default-100"
    >
      <span
        className="mt-1 w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-default-900">
            {meeting.title}
          </span>
          {meeting.team && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              {meeting.team}
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-default-500">
          <span className="flex items-center gap-1 tabular-nums">
            <Clock className="h-3.5 w-3.5" />
            {formatMeetingTimeRange(meeting, locale)}
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{meeting.location}</span>
            </span>
          )}
          {meeting.attendeeIds.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {t("drawer.attendeeCount", { count: meeting.attendeeIds.length })}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

export function MeetingsDrawer({ isOpen, onOpenChange }: MeetingsDrawerProps) {
  const { t, i18n } = useTranslation("meetings");
  const navigate = useNavigate();
  const isRtl = i18n.dir() === "rtl";
  const { data, isLoading } = useMeetingsQuery();
  const [selected, setSelected] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [editing, setEditing] = useState<Meeting | null>(null);
  const form = useDisclosure();

  const meetings = useMemo(
    () => (data?.data ?? []).filter((m) => m.status === "scheduled"),
    [data]
  );
  const dayMeetings = useMemo(
    () => meetingsOnDay(meetings, selected),
    [meetings, selected]
  );

  const selectedLabel = new Intl.DateTimeFormat(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selected);

  const openForm = (meeting: Meeting | null) => {
    setEditing(meeting);
    // Close the panel first — two stacked overlays fight over focus.
    onOpenChange(false);
    form.onOpen();
  };

  const handleSelectDay = (day: Date) => {
    setSelected(day);
    if (day.getMonth() !== month.getMonth()) setMonth(startOfMonth(day));
  };

  const goToToday = () => {
    const today = new Date();
    setSelected(today);
    setMonth(startOfMonth(today));
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement={isRtl ? "left" : "right"}
        size="sm"
        classNames={{ base: "bg-background" }}
      >
        <DrawerContent>
          <DrawerHeader className="flex items-center justify-between gap-2 border-b border-default-100 pb-3 pe-10">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold">{t("title")}</h2>
            </div>
            <Button size="sm" variant="flat" onPress={goToToday}>
              {t("drawer.today")}
            </Button>
          </DrawerHeader>

          <DrawerBody className="gap-4 py-4">
            <MiniCalendar
              month={month}
              selected={selected}
              meetings={meetings}
              locale={i18n.language}
              onSelect={handleSelectDay}
              onMonthChange={setMonth}
            />

            <div className="space-y-2 border-t border-default-100 pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-default-500">
                {selectedLabel}
              </p>

              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : dayMeetings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CalendarDays className="h-7 w-7 text-default-300" />
                  <p className="text-sm text-default-500">
                    {t("drawer.emptyDay")}
                  </p>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Plus className="h-3.5 w-3.5" />}
                    onPress={() => openForm(null)}
                  >
                    {t("newMeeting")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {dayMeetings.map((meeting) => (
                    <AgendaItem
                      key={meeting.id}
                      meeting={meeting}
                      locale={i18n.language}
                      onOpen={openForm}
                    />
                  ))}
                </div>
              )}
            </div>
          </DrawerBody>

          <DrawerFooter className="justify-between border-t border-default-100">
            <Button
              variant="light"
              size="sm"
              onPress={() => {
                onOpenChange(false);
                navigate("/meetings");
              }}
            >
              {t("drawer.viewAll")}
            </Button>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => openForm(null)}
            >
              {t("newMeeting")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <MeetingFormModal
        isOpen={form.isOpen}
        onOpenChange={form.onOpenChange}
        meeting={editing}
      />
    </>
  );
}
