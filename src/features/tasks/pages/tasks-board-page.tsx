import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "../components/kanban-board";
import { Plus } from "lucide-react";

export function TasksBoardPage() {
  const { t } = useTranslation("tasks");

  return (
    <div>
      <PageHeader
        title={t("board.title")}
        actions={
          <Button asChild>
            <Link to="/tasks/new">
              <Plus className="h-4 w-4 me-1" />
              {t("list.newTask")}
            </Link>
          </Button>
        }
      />
      <KanbanBoard />
    </div>
  );
}
