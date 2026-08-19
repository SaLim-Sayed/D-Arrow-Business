import { useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { parseDate } from "@internationalized/date";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { selectFieldProps } from "@/components/shared/select-field";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useAuthStore } from "@/stores/auth.store";
import {
  meetingFormSchema,
  toCreateMeetingDTO,
  type MeetingFormValues,
} from "../schemas/meeting.schema";
import {
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
} from "../hooks/use-meetings";
import {
  MEETING_DURATIONS,
  MEETING_REMINDER_OPTIONS,
  type Meeting,
} from "../types/meeting.types";
import {
  meetingDatePart,
  meetingTimePart,
  toMeetingStartIso,
} from "../utils/meeting.utils";

interface MeetingFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
}

function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function defaultValues(): MeetingFormValues {
  return {
    title: "",
    team: "",
    dateIso: todayIso(),
    time: "10:00",
    durationMinutes: 30,
    location: "",
    agenda: "",
    attendeeIds: [],
    reminderMinutesBefore: 0,
  };
}

export function MeetingFormModal({
  isOpen,
  onOpenChange,
  meeting,
}: MeetingFormModalProps) {
  const { t } = useTranslation("meetings");
  const { data: users } = useAllUsers();
  const currentUserId = useAuthStore((s) => s.user?.id) ?? null;
  const createMeeting = useCreateMeetingMutation();
  const updateMeeting = useUpdateMeetingMutation();
  const isEdit = !!meeting;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (!isOpen) return;
    if (meeting) {
      reset({
        title: meeting.title,
        team: meeting.team ?? "",
        dateIso: meetingDatePart(meeting.startAt),
        time: meetingTimePart(meeting.startAt),
        durationMinutes: meeting.durationMinutes || 30,
        location: meeting.location ?? "",
        agenda: meeting.agenda ?? "",
        attendeeIds: meeting.attendeeIds ?? [],
        reminderMinutesBefore: meeting.reminderMinutesBefore ?? 0,
      });
    } else {
      reset(defaultValues());
    }
  }, [isOpen, meeting, reset]);

  const onSubmit = async (values: MeetingFormValues) => {
    if (isEdit && meeting) {
      const startAt = toMeetingStartIso(values.dateIso, values.time);
      const rescheduled = startAt !== meeting.startAt;
      await updateMeeting.mutateAsync({
        id: meeting.id,
        data: {
          ...toCreateMeetingDTO(values, meeting.organizerId),
          status: meeting.status,
          // A moved meeting has to remind everyone again.
          remindedUserIds: rescheduled ? [] : meeting.remindedUserIds ?? [],
        },
      });
    } else {
      await createMeeting.mutateAsync(
        toCreateMeetingDTO(values, currentUserId)
      );
    }
    onOpenChange(false);
  };

  const busy =
    isSubmitting || createMeeting.isPending || updateMeeting.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("form.editTitle") : t("form.createTitle")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label={t("form.title")}
                placeholder={t("form.titlePlaceholder")}
                {...register("title")}
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
                isRequired
              />
              <Input
                label={t("form.team")}
                placeholder={t("form.teamPlaceholder")}
                {...register("team")}
                isInvalid={!!errors.team}
                errorMessage={errors.team?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="dateIso"
                  control={control}
                  render={({ field }) => (
                    <AppDatePicker
                      label={t("form.date")}
                      value={field.value ? parseDate(field.value) : null}
                      onChange={(date: { toString(): string } | null) => {
                        if (date) field.onChange(date.toString());
                      }}
                      isInvalid={!!errors.dateIso}
                      errorMessage={errors.dateIso?.message}
                      className="w-full"
                    />
                  )}
                />
                <Input
                  label={t("form.time")}
                  type="time"
                  {...register("time")}
                  isInvalid={!!errors.time}
                  errorMessage={errors.time?.message}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="durationMinutes"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("form.duration")}
                      selectedKeys={[String(field.value)]}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        if (v) field.onChange(Number(v));
                      }}
                    >
                      {MEETING_DURATIONS.map((minutes) => (
                        <SelectItem
                          key={String(minutes)}
                          textValue={t("form.minutes", { count: minutes })}
                        >
                          {t("form.minutes", { count: minutes })}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  name="reminderMinutesBefore"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("form.reminder")}
                      selectedKeys={[String(field.value)]}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        if (v !== undefined) field.onChange(Number(v));
                      }}
                    >
                      {MEETING_REMINDER_OPTIONS.map((minutes) => (
                        <SelectItem
                          key={String(minutes)}
                          textValue={
                            minutes === 0
                              ? t("form.reminderAtTime")
                              : t("form.reminderBefore", { count: minutes })
                          }
                        >
                          {minutes === 0
                            ? t("form.reminderAtTime")
                            : t("form.reminderBefore", { count: minutes })}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <Input
                label={t("form.location")}
                placeholder={t("form.locationPlaceholder")}
                {...register("location")}
              />

              <Controller
                name="attendeeIds"
                control={control}
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    label={t("form.attendees")}
                    placeholder={t("form.attendeesPlaceholder")}
                    selectionMode="multiple"
                    selectedKeys={new Set(field.value ?? [])}
                    onSelectionChange={(keys) => {
                      field.onChange(Array.from(keys as Set<string>));
                    }}
                  >
                    {(users ?? []).map((user) => (
                      <SelectItem key={user.id} textValue={user.name ?? user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Textarea
                label={t("form.agenda")}
                placeholder={t("form.agendaPlaceholder")}
                {...register("agenda")}
                minRows={3}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("form.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={busy}>
                {isEdit ? t("form.save") : t("form.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
