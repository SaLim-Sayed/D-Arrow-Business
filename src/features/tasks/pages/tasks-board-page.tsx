import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "../components/kanban-board";
import { Plus } from "lucide-react";

export function TasksBoardPage() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-secondary uppercase tracking-widest">
          {tc("nav.taskBoard")}
        </h2>
        <PageHeader
          title={t("board.title")}
          actions={
            <Link 
              to="/tasks/new" 
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3px]" />
              {t("list.newTask")}
            </Link>
          }
        />
      </div>
      <KanbanBoard />
    </div>
  );
}
