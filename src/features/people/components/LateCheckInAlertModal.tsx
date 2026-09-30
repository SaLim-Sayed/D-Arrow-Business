import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { AlarmClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAttendanceStore } from "@/stores/attendance.store";

/**
 * Mounted once in AppLayout so it appears on whatever page the employee is on
 * when they check in late — check-in itself happens from the header's
 * TimeTrackerWidget, which is global. Must be actively dismissed (no
 * backdrop/Esc close) so it isn't missed the way a toast can be.
 */
export function LateCheckInAlertModal() {
  const { t } = useTranslation("people");
  const lateCheckInAlert = useAttendanceStore((s) => s.lateCheckInAlert);
  const dismissLateCheckInAlert = useAttendanceStore((s) => s.dismissLateCheckInAlert);

  return (
    <Modal
      isOpen={!!lateCheckInAlert}
      onOpenChange={(open) => {
        if (!open) dismissLateCheckInAlert();
      }}
      isDismissable={false}
      isKeyboardDismissDisabled
      size="sm"
    >
      <ModalContent>
        <>
          <ModalHeader className="flex items-center gap-2 text-warning-600">
            <AlarmClock className="h-5 w-5" />
            {t("attendance_toast.late_checkin_alert_title")}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              {lateCheckInAlert?.deducted
                ? t("attendance_toast.late_checkin_deducted", {
                    minutes: lateCheckInAlert.minutes,
                  })
                : t("attendance_toast.late_checkin", {
                    minutes: lateCheckInAlert?.minutes ?? 0,
                  })}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              className="rounded-xl font-semibold"
              onPress={dismissLateCheckInAlert}
            >
              {t("attendance_toast.late_checkin_ack")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
