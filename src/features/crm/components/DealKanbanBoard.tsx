import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Card, CardBody, Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useDealsQuery, useUpdateDealStageMutation } from "../hooks/use-deals";
import { useContactsQuery } from "../hooks/use-contacts";
import { DEAL_STAGES, normalizeDealStage } from "../constants/deal-workflow";
import type { Deal, DealStage } from "../types/deals.types";
import type { Contact } from "../types/contacts.types";

function FormatDealAmount({ amount }: { amount: number }) {
  return <MoneyAmount amount={amount} />;
}

function contactDisplayName(contact: Contact | undefined) {
  if (!contact) return null;
  const name = `${contact.firstName} ${contact.lastName}`.trim();
  return name || contact.firstName;
}

interface DealCardProps {
  deal: Deal;
  contactName: string | null;
  isDragging?: boolean;
}

function DealCard({ deal, contactName, isDragging }: DealCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/crm/deals/${deal.id}`)}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        isDragging ? "opacity-50 scale-105" : "hover:scale-[1.01]"
      )}
    >
      <Card
        className={cn(
          "border border-default-200 dark:border-default-100 shadow-sm hover:shadow-md dark:hover:shadow-primary/10 transition-all duration-300 rounded-xl bg-white dark:bg-content1/50 backdrop-blur-sm",
          isDragging && "shadow-2xl ring-2 ring-primary/20 rotate-1 scale-[1.02]"
        )}
      >
        <CardBody className="p-4 space-y-2">
          <h4 className="text-sm font-bold text-primary leading-snug group-hover:text-primary transition-colors">
            {deal.title}
          </h4>
          <p className="text-sm font-semibold text-foreground">
            <FormatDealAmount amount={deal.amount} />
          </p>
          {contactName && (
            <p className="text-xs text-default-500 truncate">{contactName}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

const columnConfig: Record<
  DealStage,
  { color: string; bg: string; dot: string }
> = {
  lead: {
    color: "text-default-600 dark:text-default-400",
    bg: "bg-default-50/50 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-default-400",
  },
  contacted: {
    color: "text-warning-600 dark:text-warning-400",
    bg: "bg-warning-50/20 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-warning-500",
  },
  qualified: {
    color: "text-primary-600 dark:text-primary-400",
    bg: "bg-primary-50/20 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-primary-500",
  },
  proposal_sent: {
    color: "text-secondary-600 dark:text-secondary-400",
    bg: "bg-secondary-50/20 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-secondary-500",
  },
  negotiation: {
    color: "text-primary-600 dark:text-primary-400",
    bg: "bg-primary-50/20 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-primary-500",
  },
  won: {
    color: "text-success-600 dark:text-success-400",
    bg: "bg-success-50/20 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-success-500",
  },
  lost: {
    color: "text-danger-600 dark:text-danger-400",
    bg: "bg-danger-50/20 dark:bg-default-50/30 border border-transparent dark:border-default-100/30",
    dot: "border-danger-500",
  },
};

export function DealKanbanBoard() {
  const { t } = useTranslation("crm");
  const { data: dealsRes, isLoading: dealsLoading } = useDealsQuery();
  const { data: contactsRes, isLoading: contactsLoading } = useContactsQuery();
  const updateStage = useUpdateDealStageMutation();

  const contactsById = new Map((contactsRes?.data ?? []).map((c) => [c.id, c]));
  const deals = (dealsRes?.data ?? []).map((d) => ({
    ...d,
    stage: normalizeDealStage(d.stage),
  }));

  const columns: Record<DealStage, Deal[]> = {
    lead: [],
    contacted: [],
    qualified: [],
    proposal_sent: [],
    negotiation: [],
    won: [],
    lost: [],
  };

  for (const deal of deals) {
    if (deal.stage in columns) {
      columns[deal.stage].push(deal);
    }
  }

  const boardRef = useRef<HTMLDivElement>(null);
  const isDraggingBoard = useRef(false);
  const boardDragStartX = useRef(0);
  const boardDragScrollLeft = useRef(0);

  const handleSideScroll = (direction: "left" | "right") => {
    const el = boardRef.current;
    if (!el) return;
    const step = 350;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  // Drag-to-scroll on board background / empty column space
  const handleBoardPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-rfd-draggable-id]") || target.closest("button") || target.closest("a")) return;

    isDraggingBoard.current = true;
    boardDragStartX.current = e.clientX;
    boardDragScrollLeft.current = boardRef.current?.scrollLeft ?? 0;

    const isRTL = document.dir === "rtl" || document.documentElement.dir === "rtl";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingBoard.current || !boardRef.current) return;
      const deltaX = moveEvent.clientX - boardDragStartX.current;
      if (isRTL) {
        boardRef.current.scrollLeft = boardDragScrollLeft.current + deltaX;
      } else {
        boardRef.current.scrollLeft = boardDragScrollLeft.current - deltaX;
      }
    };

    const handlePointerUp = () => {
      isDraggingBoard.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStage = result.destination.droppableId as DealStage;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    updateStage.mutate({ id: dealId, stage: newStage });
  }

  if (dealsLoading || contactsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden group/board">
      {/* Floating Side Scroll Button - Left */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <Button
          isIconOnly
          variant="solid"
          color="primary"
          size="lg"
          className="rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all bg-primary text-white backdrop-blur-md border-2 border-white/30 h-12 w-12 min-w-12"
          onPress={() => handleSideScroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6 stroke-[3]" />
        </Button>
      </div>

      {/* Floating Side Scroll Button - Right */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <Button
          isIconOnly
          variant="solid"
          color="primary"
          size="lg"
          className="rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all bg-primary text-white backdrop-blur-md border-2 border-white/30 h-12 w-12 min-w-12"
          onPress={() => handleSideScroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6 stroke-[3]" />
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div 
          ref={boardRef}
          onPointerDown={handleBoardPointerDown}
          className="flex-1 flex gap-6 overflow-x-auto overflow-y-hidden pb-4 min-h-0 kanban-scroll cursor-grab active:cursor-grabbing select-none px-6"
        >
          {DEAL_STAGES.map((stage) => (
            <div
              key={stage}
              className={cn(
                "flex-shrink-0 w-[300px] flex flex-col h-full group/column rounded-2xl transition-all duration-300 overflow-hidden mb-1",
                columnConfig[stage].bg
              )}
            >
              <div className="flex items-center gap-3 px-3 py-3 mb-1 shrink-0">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-[3px] shrink-0",
                    columnConfig[stage].dot
                  )}
                />
                <h3
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    columnConfig[stage].color
                  )}
                >
                  {t(`deals.stage.${stage}`)}
                </h3>
                <span className="text-[11px] font-medium text-default-400">
                  ( {columns[stage].length} )
                </span>
              </div>

              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl transition-colors duration-200 p-1.5 kanban-scroll",
                      snapshot.isDraggingOver ? "bg-default-100/50" : "bg-transparent"
                    )}
                  >
                    <div className="space-y-3">
                      {columns[stage].map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="outline-none"
                            >
                              <DealCard
                                deal={deal}
                                contactName={contactDisplayName(
                                  deal.contactId
                                    ? contactsById.get(deal.contactId)
                                    : undefined
                                )}
                                isDragging={dragSnapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {columns[stage].length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in duration-500">
                          <div className="h-24 w-32 mb-6 opacity-20 dark:opacity-10">
                            <svg
                              viewBox="0 0 120 80"
                              className="w-full h-full fill-current text-default-300 dark:text-default-700"
                            >
                              <rect x="10" y="10" width="40" height="25" rx="2" />
                              <rect x="60" y="15" width="40" height="25" rx="2" />
                              <rect x="20" y="45" width="40" height="25" rx="2" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-bold text-default-400 dark:text-default-500 mb-2">
                            {t("deals.board.emptyTitle")}
                          </h4>
                          <p className="text-xs text-default-300 dark:text-default-600 leading-relaxed max-w-[200px]">
                            {t("deals.board.emptySubtitle")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

