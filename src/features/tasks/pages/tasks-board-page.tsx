import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "../components/kanban-board";
import { Plus } from "lucide-react";

export function TasksBoardPage() {
  const { t } = useTranslation("tasks");

  return (
    <div>
      <PageHeader
        title={t("board.title")}
        actions={
          <Link 
            to="/tasks/new" 
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("list.newTask")}
          </Link>
        }
      />
      <KanbanBoard />
    </div>
  );
}
