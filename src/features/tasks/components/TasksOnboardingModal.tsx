import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Progress,
} from "@heroui/react";
import {
  GraduationCap,
  CheckCircle2,
  Kanban,
  ClipboardCheck,
  CalendarRange,
  Plus,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface TasksOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TasksOnboardingModal({
  isOpen,
  onClose,
}: TasksOnboardingModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tutorialSteps = [
    {
      id: "board",
      title: isAr ? "1. مساحة العمل ولوحة كانبان" : "1. Tasks Workspace & Kanban Board",
      subtitle: isAr
        ? "تعلم تنظيم وإدارة المهام اليومية بسلاسة وسحب وإفلات البطاقات"
        : "Learn how to organize daily work with drag-and-drop Kanban cards",
      icon: Kanban,
      badgeColor: "primary" as const,
      color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              {isAr ? "ماذا يمكنك أن تفعل في مساحة المهام؟" : "Key Workspace Features"}
            </h4>
            <ul className="text-xs space-y-2 text-default-600 leading-relaxed list-disc list-inside">
              <li>{isAr ? "التحكم الكامل بفرز المهام (لوحة كانبان تفاعلية أو جدول تفصيلي)." : "Full control over view modes (Kanban board or detailed list)."}</li>
              <li>{isAr ? "السحب والإفلات الفوري لنقل المهمة بين الحالات (قيد التنفيذ ⬅️ قيد المراجعة ⬅️ مكتملة)." : "Drag and drop cards to change status instantly."}</li>
              <li>{isAr ? "التعديل السريع المباشر للحالة والأولوية بنقرة واحدة من القائمة." : "1-click inline status and priority updates directly from table rows."}</li>
              <li>{isAr ? "تصفية المهام المتقدمة حسب المسؤول، الأولوية، أو السبرنت." : "Filter tasks by assignee, priority level, or active sprint."}</li>
            </ul>
          </div>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => {
              onClose();
              navigate("/tasks/work");
            }}
            startContent={<ExternalLink size={14} />}
            className="font-bold text-xs rounded-xl w-full"
          >
            {isAr ? "الانتقال التجريبي لمساحة العمل الآن" : "Go to Tasks Workspace Now"}
          </Button>
        </div>
      ),
    },
    {
      id: "create",
      title: isAr ? "2. إنشاء وإسناد المهام والتكليفات" : "2. Task Creation & Assignment",
      subtitle: isAr
        ? "خطوات إضافة مهمة جديدة وتحديد المسئولين والتاريخ النهائي"
        : "How to create a task, set assignees, and define deadlines",
      icon: Plus,
      badgeColor: "success" as const,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              {isAr ? "خطوات إنشاء المهمة بنجاح" : "Steps to Create a Task"}
            </h4>
            <ul className="text-xs space-y-2 text-default-600 leading-relaxed list-disc list-inside">
              <li>{isAr ? "اكتب عنواناً واقحاً وتفاصيل الدوافع أو المخرجات المطلوبة." : "Enter a clear title and target output requirements."}</li>
              <li>{isAr ? "اختر الموظف المسؤول وحسد مستوى الأولوية (عالية جداً، عالية، متوسطة، منخفضة)." : "Assign responsible team member and set priority level."}</li>
              <li>{isAr ? "حدّد تاريخ الاستحقاق النهائي لضمان متابعة التأخيرات تلقائياً." : "Set a due date to enable automatic overdue tracking."}</li>
              <li>{isAr ? "ربط المهمة بسبرنت أو دورة عمل محددة لتأطير التخطيط." : "Optionally attach the task to an active sprint cycle."}</li>
            </ul>
          </div>
          <Button
            size="sm"
            color="success"
            variant="flat"
            onPress={() => {
              onClose();
              navigate("/tasks/new");
            }}
            startContent={<ExternalLink size={14} />}
            className="font-bold text-xs rounded-xl w-full"
          >
            {isAr ? "تجربة إنشاء مهمة جديدة" : "Try Creating a New Task"}
          </Button>
        </div>
      ),
    },
    {
      id: "daily-reports",
      title: isAr ? "3. تقارير الإنجاز اليومية للموظفين" : "3. Employee Daily Work Reports",
      subtitle: isAr
        ? "متابعة ساعات العمل، الإنجازات، التحديات وتقييم المشرفين"
        : "Track daily hours, accomplishments, blockers, and supervisor reviews",
      icon: ClipboardCheck,
      badgeColor: "secondary" as const,
      color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/15 space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-sky-500" />
              {isAr ? "كيف تعمل تقارير العمل اليومية؟" : "How Daily Reports Work"}
            </h4>
            <ul className="text-xs space-y-2 text-default-600 leading-relaxed list-disc list-inside">
              <li>{isAr ? "يقوم الموظف بتسجيل ساعات العمل اليومية وتلخيص إنجازات يومه عند الانصراف." : "Employees submit check-out summary and working hours daily."}</li>
              <li>{isAr ? "تحديد التحديات والمعوقات (Blockers) لإرسال تنبيه فوري للإدارة." : "Highlight blockers to notify management instantly."}</li>
              <li>{isAr ? "يقوم المدير/المشرف بتقييم الإنتاجية بنجوم من 1 إلى 5 وإضافة توجيهات المتابعة." : "Supervisors rate performance from 1 to 5 stars and add guidance."}</li>
              <li>{isAr ? "طباعة التقرير أو مشاركته فوراً بنقرة واحدة عبر الواتساب." : "1-click report print, text copy, or WhatsApp sharing."}</li>
            </ul>
          </div>
          <Button
            size="sm"
            color="secondary"
            variant="flat"
            onPress={() => {
              onClose();
              navigate("/tasks/daily-reports");
            }}
            startContent={<ExternalLink size={14} />}
            className="font-bold text-xs rounded-xl w-full"
          >
            {isAr ? "استعراض جدول التقارير اليومية" : "View Daily Reports Page"}
          </Button>
        </div>
      ),
    },
    {
      id: "sprints",
      title: isAr ? "4. دورات التطوير والتخطيط (Sprints)" : "4. Sprint Cycles & Planning",
      subtitle: isAr
        ? "تجميع المهام في دورات زمنية مركزة وتحقيق الأهداف البرمجية والتشغيلية"
        : "Bundle tasks into focused time-boxed sprints to hit objectives",
      icon: CalendarRange,
      badgeColor: "warning" as const,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              {isAr ? "فوائد إدارة السبرنتات" : "Benefits of Sprint Planning"}
            </h4>
            <ul className="text-xs space-y-2 text-default-600 leading-relaxed list-disc list-inside">
              <li>{isAr ? "تحديد مدة زمنية محددة (مثل أسبوعين) لإنجاز حزمة أهداف متكاملة." : "Set clear timeframes (e.g. 2 weeks) to deliver sprint goals."}</li>
              <li>{isAr ? "توزيع المهام غير المنجزة (Backlog) على أعضاء الفريق بشكل عادل." : "Equitably distribute backlog tasks to team members."}</li>
              <li>{isAr ? "متابعة نسبة إنجاز السبرنت ومؤشر التقدم الإجمالي لحظياً." : "Track real-time completion progress indicators."}</li>
            </ul>
          </div>
          <Button
            size="sm"
            color="warning"
            variant="flat"
            onPress={() => {
              onClose();
              navigate("/tasks/sprints");
            }}
            startContent={<ExternalLink size={14} />}
            className="font-bold text-xs rounded-xl w-full"
          >
            {isAr ? "الانتقال لصفحة دورات التطوير" : "Go to Sprint Cycles Page"}
          </Button>
        </div>
      ),
    },
  ];

  const currentStepData = tutorialSteps[currentStep];
  const StepIcon = currentStepData.icon;
  const progressPercent = Math.round(((completedSteps.length) / tutorialSteps.length) * 100);

  const toggleStepCompleted = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      backdrop="blur"
      classNames={{
        base: "bg-background border border-default-200 shadow-2xl rounded-3xl overflow-hidden",
      }}
    >
      <ModalContent dir={isAr ? "rtl" : "ltr"}>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-2 border-b border-default-100 bg-default-50/50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    <GraduationCap size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                      {isAr ? "الدليل التعليمي التفاعلي لنظام المهام" : "Tasks Interactive Training Course"}
                      <Chip size="sm" color="primary" variant="flat" className="font-bold text-[10px]">
                        {completedSteps.length}/{tutorialSteps.length} {isAr ? "مكتمل" : "done"}
                      </Chip>
                    </h3>
                    <p className="text-xs text-default-400 font-medium mt-0.5">
                      {isAr ? "دورة تدريبية مبسطة لاحتراف استخدام الأدوات ولوحات العمل والتقارير" : "Master the tasks workspace, daily reports, and sprint workflows"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-extrabold text-default-500">
                  <span>{isAr ? "تقدم الدورة التدريبية:" : "Course Progress:"}</span>
                  <span className="text-primary font-black">{progressPercent}%</span>
                </div>
                <Progress
                  aria-label="Course Progress"
                  size="sm"
                  value={progressPercent}
                  color="primary"
                  className="h-2 rounded-full"
                >
                </Progress>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6">
              {/* Steps Nav Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tutorialSteps.map((step, idx) => {
                  const IconComp = step.icon;
                  const isCurrent = idx === currentStep;
                  const isDone = completedSteps.includes(idx);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      className={`p-2.5 rounded-2xl border text-start transition-all flex items-center gap-2 ${
                        isCurrent
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/30"
                          : isDone
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 font-medium"
                          : "border-default-200/60 bg-default-50/50 text-default-500 hover:bg-default-100/60"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <IconComp size={16} />
                        {isDone && (
                          <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-emerald-500 bg-background rounded-full fill-emerald-500 text-white" />
                        )}
                      </div>
                      <span className="text-xs truncate font-bold">
                        {step.title.split(". ")[1] || step.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Step Card Details */}
              <div className="p-5 rounded-3xl border border-default-200/80 bg-background/80 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${currentStepData.color}`}>
                      <StepIcon size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-foreground">
                        {currentStepData.title}
                      </h4>
                      <p className="text-xs text-default-400 font-medium mt-0.5">
                        {currentStepData.subtitle}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={completedSteps.includes(currentStep) ? "solid" : "flat"}
                    color={completedSteps.includes(currentStep) ? "success" : "default"}
                    onPress={() => toggleStepCompleted(currentStep)}
                    startContent={<CheckCircle2 size={14} />}
                    className="font-bold text-xs rounded-xl shrink-0"
                  >
                    {completedSteps.includes(currentStep)
                      ? (isAr ? "تم إكمال الدرس ✓" : "Completed ✓")
                      : (isAr ? "تحديد كـ مكتمل" : "Mark as Done")}
                  </Button>
                </div>

                {currentStepData.content}
              </div>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between border-t border-default-100 bg-default-50/30 p-4">
              <Button
                size="sm"
                variant="flat"
                disabled={currentStep === 0}
                onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                startContent={<ArrowRight size={14} className="rtl:rotate-180" />}
                className="font-bold text-xs rounded-xl"
              >
                {isAr ? "الدرس السابق" : "Previous"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={onClose}
                  className="font-bold text-xs rounded-xl"
                >
                  {isAr ? "إغلاق" : "Close"}
                </Button>

                {currentStep < tutorialSteps.length - 1 ? (
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => {
                      if (!completedSteps.includes(currentStep)) {
                        toggleStepCompleted(currentStep);
                      }
                      setCurrentStep((prev) => Math.min(tutorialSteps.length - 1, prev + 1));
                    }}
                    endContent={<ArrowLeft size={14} className="rtl:rotate-180" />}
                    className="font-bold text-xs rounded-xl"
                  >
                    {isAr ? "الدرس التالي" : "Next Step"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    color="success"
                    onPress={() => {
                      if (!completedSteps.includes(currentStep)) {
                        toggleStepCompleted(currentStep);
                      }
                      onClose();
                    }}
                    startContent={<BookOpen size={14} />}
                    className="font-bold text-xs rounded-xl"
                  >
                    {isAr ? "إنهاء الدورة التدريبية 🎉" : "Finish Tutorial 🎉"}
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
