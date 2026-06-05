import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Card, CardBody, Chip } from "@heroui/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import { useLeadsQuery, useUpdateLeadMutation } from "../hooks/use-leads";
import { useAllUsers } from "@/features/users/hooks/use-users";
import {
  LEAD_STATUSES,
  LEAD_STATUS_COLORS,
  normalizeLeadStatus,
} from "../constants/lead-workflow";
import type { Lead, LeadStatus } from "../types/leads.types";

const PIPELINE_STAGES: LeadStatus[] = LEAD_STATUSES.filter((s) => s !== "lost");
const TERMINAL: LeadStatus[] = ["won", "lost"];

function LeadCard({
  lead,
  assigneeName,
  isDragging,
  onClick,
}: {
  lead: Lead;
  assigneeName: string | null;
  isDragging?: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation("crm");
  const status = normalizeLeadStatus(lead.status);

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all",
        isDragging ? "opacity-50 scale-105" : "hover:scale-[1.01]"
      )}
    >
      <Card
        className={cn(
          "border border-default-200 shadow-sm hover:shadow-md rounded-xl",
          isDragging && "shadow-2xl ring-2 ring-primary/20"
        )}
      >
        <CardBody className="p-3 space-y-1.5">
          <h4 className="text-sm font-bold text-primary leading-snug">{lead.name}</h4>
          {lead.company && <p className="text-xs text-default-500 truncate">{lead.company}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Chip size="sm" variant="flat" color={LEAD_STATUS_COLORS[status]} className="h-5 text-[9px]">
              {t(`leads.status.${status}`)}
            </Chip>
            {assigneeName && (
              <span className="text-[10px] text-default-400 truncate">{assigneeName}</span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function LeadKanbanBoard() {
  const { t } = useTranslation("crm");
  const navigate = useNavigate();
  const { data, isLoading } = useLeadsQuery();
  const { data: users } = useAllUsers();
  const updateLead = useUpdateLeadMutation();

  if (isLoading || !users) return <LoadingSpinner />;

  const leads = (data?.data ?? []).map((l) => ({
    ...l,
    status: normalizeLeadStatus(l.status) as LeadStatus,
  }));

  const columns: Record<LeadStatus, Lead[]> = Object.fromEntries(
    LEAD_STATUSES.map((s) => [s, [] as Lead[]])
  ) as Record<LeadStatus, Lead[]>;

  for (const lead of leads) {
    if (lead.status in columns) columns[lead.status].push(lead);
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    updateLead.mutate({ id: leadId, data: { status: newStatus } });
  };

  const stagesToShow = [...PIPELINE_STAGES.filter((s) => s !== "won"), ...TERMINAL];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[420px] scrollbar-hide">
        {stagesToShow.map((status) => (
          <div key={status} className="flex-shrink-0 w-[280px] flex flex-col rounded-2xl bg-default-50/80 border border-default-100">
            <div className="p-3 border-b border-default-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-default-600">
                {t(`leads.status.${status}`)}
              </span>
              <Chip size="sm" variant="flat">{columns[status].length}</Chip>
            </div>
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 p-2 space-y-2 min-h-[120px] transition-colors",
                    snapshot.isDraggingOver && "bg-primary/5"
                  )}
                >
                  {columns[status].map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                        >
                          <LeadCard
                            lead={lead}
                            assigneeName={
                              lead.assignedTo
                                ? users.find((u) => u.id === lead.assignedTo)?.name ?? null
                                : null
                            }
                            isDragging={dragSnapshot.isDragging}
                            onClick={() => navigate(`/crm/leads/${lead.id}`)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
