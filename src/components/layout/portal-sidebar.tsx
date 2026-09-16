import { useEffect, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import { Button, Tooltip } from "@heroui/react";
import { Logo } from "../shared/logo";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  GripVertical,
  RotateCcw,
  Search,
  Star,
  Folder,
  FolderOpen,
  Maximize2,
  Minimize2,
  X,
  ReceiptText,
  Handshake,
  Users,
  ListTodo,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import type { PortalId } from "@/lib/portal-permissions";
import {
  getNavTreeForPortal,
  type PortalNavTreeGroup,
  type PortalNavItem,
} from "@/lib/portal-nav";
import { useAccessiblePortals } from "@/features/portals/hooks/use-portals";
import { ChatInboxBadge } from "@/features/chat/components/ChatInboxBadge";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

const PORTAL_DETAILS: Record<
  PortalId,
  {
    titleKey: string;
    titleAr: string;
    icon: LucideIcon;
    iconColor: string;
  }
> = {
  billing: {
    titleKey: "portals.billing.short",
    titleAr: "المحاسبة والمالية",
    icon: ReceiptText,
    iconColor: "text-orange-500 dark:text-orange-400",
  },
  crm: {
    titleKey: "portals.crm.short",
    titleAr: "إدارة العملاء",
    icon: Handshake,
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  people: {
    titleKey: "portals.people.short",
    titleAr: "الموارد البشرية",
    icon: Users,
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  tasks: {
    titleKey: "portals.tasks.short",
    titleAr: "إدارة المهام والمشاريع",
    icon: ListTodo,
    iconColor: "text-purple-500 dark:text-purple-400",
  },
  chat: {
    titleKey: "portals.chat.short",
    titleAr: "المحادثات والرسائل",
    icon: MessageSquare,
    iconColor: "text-cyan-500 dark:text-cyan-400",
  },
};

const GROUP_TITLES_AR: Record<string, string> = {
  general: "الرئيسية والعامة",
  sales: "المبيعات والإيرادات",
  purchases: "المشتريات والمصروفات",
  reports_tax: "التقارير والمراكز المالية",
  chart_accounts: "دليل الحسابات والإعدادات",
  deals_leads: "إدارة العملاء والصفقات",
  contracts_reports: "عروض الأسعار والتقارير",
  attendance_leave: "الحضور والإجازات",
  performance: "تقييم الأداء",
  work_sprints: "إدارة العمل والدورات",
  messages: "المحادثات والرسائل",
};

interface PortalSidebarProps {
  portal: PortalId;
}

export function PortalSidebar({ portal }: PortalSidebarProps) {
  const { t, i18n } = useTranslation();
  const { t: tCrm } = useTranslation("crm");
  const { t: tBilling } = useTranslation("billing");
  const { t: tChat } = useTranslation("chat");
  const { sidebarCollapsed, toggleSidebar, setPortalPickerOpen } = useLayoutStore();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const defaultTree = useMemo(() => getNavTreeForPortal(portal), [portal]);
  const [treeGroups, setTreeGroups] = useState<PortalNavTreeGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize tree groups, expanded states, and favorites from localStorage
  useEffect(() => {
    try {
      // Restore group order
      const savedOrderRaw = localStorage.getItem(`sidebar_tree_order_${portal}`);
      let currentTree = defaultTree;
      if (savedOrderRaw) {
        const savedIds: string[] = JSON.parse(savedOrderRaw);
        const map = new Map(defaultTree.map((g) => [g.id, g]));
        const ordered: PortalNavTreeGroup[] = [];
        for (const id of savedIds) {
          if (map.has(id)) {
            ordered.push(map.get(id)!);
            map.delete(id);
          }
        }
        for (const g of map.values()) {
          ordered.push(g);
        }
        currentTree = ordered;
      }

      // Restore items order inside groups
      const savedItemOrdersRaw = localStorage.getItem(`sidebar_tree_item_orders_${portal}`);
      if (savedItemOrdersRaw) {
        const itemOrders: Record<string, string[]> = JSON.parse(savedItemOrdersRaw);
        currentTree = currentTree.map((group) => {
          const savedItemPaths = itemOrders[group.id];
          if (!savedItemPaths) return group;
          const itemMap = new Map(group.items.map((i) => [i.path, i]));
          const orderedItems: PortalNavItem[] = [];
          for (const p of savedItemPaths) {
            if (itemMap.has(p)) {
              orderedItems.push(itemMap.get(p)!);
              itemMap.delete(p);
            }
          }
          for (const item of itemMap.values()) {
            orderedItems.push(item);
          }
          return { ...group, items: orderedItems };
        });
      }

      setTreeGroups(currentTree);

      // Restore expanded state
      const savedExpandedRaw = localStorage.getItem(`sidebar_tree_expanded_${portal}`);
      if (savedExpandedRaw) {
        setExpandedGroups(JSON.parse(savedExpandedRaw));
      } else {
        const initialExpanded: Record<string, boolean> = {};
        currentTree.forEach((g) => {
          initialExpanded[g.id] = true;
        });
        setExpandedGroups(initialExpanded);
      }

      // Restore favorites
      const savedFavsRaw = localStorage.getItem(`sidebar_favorites_${portal}`);
      if (savedFavsRaw) {
        setFavorites(JSON.parse(savedFavsRaw));
      }
    } catch {
      setTreeGroups(defaultTree);
    }
  }, [portal, defaultTree]);

  // Keyboard shortcut (Cmd/Ctrl + K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-expand active group on location change
  useEffect(() => {
    const currentPath = location.pathname;
    treeGroups.forEach((group) => {
      const containsActive = group.items.some(
        (item) => item.path === currentPath || (item.path !== "/" && currentPath.startsWith(item.path))
      );
      if (containsActive) {
        setExpandedGroups((prev) => {
          if (!prev[group.id]) {
            const next = { ...prev, [group.id]: true };
            try {
              localStorage.setItem(`sidebar_tree_expanded_${portal}`, JSON.stringify(next));
            } catch {
              /* ignore */
            }
            return next;
          }
          return prev;
        });
      }
    });
  }, [location.pathname, treeGroups, portal]);

  const saveExpandedState = (newExpanded: Record<string, boolean>) => {
    setExpandedGroups(newExpanded);
    try {
      localStorage.setItem(`sidebar_tree_expanded_${portal}`, JSON.stringify(newExpanded));
    } catch {
      // Fallback
    }
  };

  const toggleGroup = (groupId: string) => {
    const next = { ...expandedGroups, [groupId]: !expandedGroups[groupId] };
    saveExpandedState(next);
  };

  const toggleFavorite = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let nextFavs: string[];
    if (favorites.includes(path)) {
      nextFavs = favorites.filter((p) => p !== path);
    } else {
      nextFavs = [...favorites, path];
    }
    setFavorites(nextFavs);
    try {
      localStorage.setItem(`sidebar_favorites_${portal}`, JSON.stringify(nextFavs));
    } catch {
      /* ignore */
    }
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    treeGroups.forEach((g) => {
      next[g.id] = true;
    });
    saveExpandedState(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    treeGroups.forEach((g) => {
      next[g.id] = false;
    });
    saveExpandedState(next);
  };

  // Drag and Drop handling for groups and items
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === "GROUP") {
      if (source.index === destination.index) return;
      const newGroups = Array.from(treeGroups);
      const [moved] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, moved);

      setTreeGroups(newGroups);
      try {
        const ids = newGroups.map((g) => g.id);
        localStorage.setItem(`sidebar_tree_order_${portal}`, JSON.stringify(ids));
      } catch {
        // Fallback
      }
    } else if (type.startsWith("ITEM_")) {
      const groupId = type.replace("ITEM_", "");
      if (source.index === destination.index) return;

      const groupIndex = treeGroups.findIndex((g) => g.id === groupId);
      if (groupIndex === -1) return;

      const targetGroup = treeGroups[groupIndex];
      const newItems = Array.from(targetGroup.items);
      const [movedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);

      const newGroups = [...treeGroups];
      newGroups[groupIndex] = { ...targetGroup, items: newItems };
      setTreeGroups(newGroups);

      try {
        const savedItemOrdersRaw = localStorage.getItem(`sidebar_tree_item_orders_${portal}`);
        const itemOrders: Record<string, string[]> = savedItemOrdersRaw ? JSON.parse(savedItemOrdersRaw) : {};
        itemOrders[groupId] = newItems.map((i) => i.path);
        localStorage.setItem(`sidebar_tree_item_orders_${portal}`, JSON.stringify(itemOrders));
      } catch {
        /* ignore */
      }
    }
  };

  const handleResetOrder = () => {
    localStorage.removeItem(`sidebar_tree_order_${portal}`);
    localStorage.removeItem(`sidebar_tree_item_orders_${portal}`);
    localStorage.removeItem(`sidebar_tree_expanded_${portal}`);
    localStorage.removeItem(`sidebar_favorites_${portal}`);
    setTreeGroups(defaultTree);
    setFavorites([]);
    const initialExpanded: Record<string, boolean> = {};
    defaultTree.forEach((g) => {
      initialExpanded[g.id] = true;
    });
    setExpandedGroups(initialExpanded);
    setSearchQuery("");
  };

  const getItemLabel = (item: PortalNavItem) => {
    if (item.namespace === "crm") return tCrm(item.labelKey);
    if (item.namespace === "billing") return tBilling(item.labelKey);
    if (item.namespace === "chat") return tChat(item.labelKey);
    return t(item.labelKey);
  };

  const getGroupLabel = (group: PortalNavTreeGroup) => {
    if (GROUP_TITLES_AR[group.id]) return GROUP_TITLES_AR[group.id];
    return t(group.labelKey);
  };

  const isRtl = i18n.dir() === "rtl";
  const portals = useAccessiblePortals();
  const portalDetails = PORTAL_DETAILS[portal];
  const PortalIcon = portalDetails.icon;

  const CollapseIcon = sidebarCollapsed
    ? isRtl
      ? ChevronLeft
      : ChevronRight
    : isRtl
      ? ChevronRight
      : ChevronLeft;
  const expandLabel = sidebarCollapsed
    ? t("actions.expand")
    : t("actions.collapse");

  // All flat items lookup
  const allFlatItemsMap = useMemo(() => {
    const map = new Map<string, PortalNavItem>();
    defaultTree.forEach((g) => {
      g.items.forEach((i) => map.set(i.path, i));
    });
    return map;
  }, [defaultTree]);

  // Favorite items list
  const favoriteItems = useMemo(() => {
    return favorites
      .map((p) => allFlatItemsMap.get(p))
      .filter((i): i is PortalNavItem => Boolean(i));
  }, [favorites, allFlatItemsMap]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return treeGroups;
    const query = searchQuery.toLowerCase().trim();
    return treeGroups
      .map((group) => {
        const groupMatch = getGroupLabel(group).toLowerCase().includes(query);
        const matchingItems = group.items.filter((item) =>
          getItemLabel(item).toLowerCase().includes(query)
        );
        if (groupMatch || matchingItems.length > 0) {
          return {
            ...group,
            items: groupMatch ? group.items : matchingItems,
          };
        }
        return null;
      })
      .filter((g): g is PortalNavTreeGroup => g !== null);
  }, [treeGroups, searchQuery, t, tCrm, tBilling, tChat]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-30 hidden md:flex flex-col",
        "border-e border-default-200/80 bg-sidebar text-sidebar-foreground",
        "transition-all duration-300 shadow-premium overflow-y-auto print:hidden",
        sidebarCollapsed ? "w-[5.5rem]" : "w-72"
      )}
    >
      {/* Unified Top Header & Search Bar Section (Single Section) */}
      <div
        className={cn(
          "border-b border-default-200/80 transition-all duration-300 bg-default-50/60",
          sidebarCollapsed
            ? "flex h-16 items-center justify-center gap-1 px-1.5"
            : "flex flex-col gap-3 p-3.5"
        )}
      >
        {sidebarCollapsed ? (
          <div className="flex items-center justify-center gap-1">
            <Tooltip
              content={portalDetails.titleAr}
              placement={isRtl ? "left" : "right"}
            >
              <Logo
                size="sm"
                variant="icon"
                to="/"
                title={t("portals.allApps")}
                className="h-9 w-9 shrink-0 [&_img]:h-9"
              />
            </Tooltip>
            <Tooltip
              content={expandLabel}
              placement={isRtl ? "left" : "right"}
            >
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className="h-8 w-8 min-w-8 shrink-0 bg-default-100/50 hover:bg-default-200/50"
                aria-label={expandLabel}
                onPress={toggleSidebar}
              >
                <CollapseIcon className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        ) : (
          <>
            {/* Top Row: Logo + Portal Title + Collapse Button in Single Background */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Logo
                  size="sm"
                  variant="icon"
                  to="/"
                  title={t("portals.allApps")}
                  className="h-9 w-9 shrink-0 [&_img]:h-9"
                />
                <Tooltip
                  content={portalDetails.titleAr}
                  placement={isRtl ? "bottom-start" : "bottom-end"}
                  delay={300}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 px-1 py-1 transition-all cursor-default">
                    <PortalIcon className={cn("h-5 w-5 shrink-0", portalDetails.iconColor)} />
                    <span className="text-sm font-extrabold truncate text-foreground leading-snug">
                      {portalDetails.titleAr}
                    </span>
                  </div>
                </Tooltip>
              </div>

              <Tooltip content={expandLabel} placement={isRtl ? "left" : "right"}>
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  className="h-8 w-8 min-w-8 shrink-0 bg-transparent hover:bg-default-200/60 text-default-500 hover:text-foreground border-none shadow-none rounded-xl"
                  aria-label={expandLabel}
                  onPress={toggleSidebar}
                >
                  <CollapseIcon className="h-4.5 w-4.5" />
                </Button>
              </Tooltip>
            </div>

            {/* Bottom Row: Search Input Bar & Action Buttons */}
            <div className="flex items-center gap-1.5 w-full">
              {/* Search Input Bar (Flex-1) */}
              <div className="group/search relative flex flex-1 items-center min-w-0 rounded-xl bg-default-100/90 hover:bg-default-200/60 border border-default-200/80 focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs">
                <Search className="absolute start-3 h-4 w-4 text-default-400 group-focus-within/search:text-primary transition-colors pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث هنا..."
                  className="w-full h-9 ps-9 pe-7 text-xs md:text-sm font-medium bg-transparent outline-none transition-all placeholder:text-default-400"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute end-2 p-0.5 text-default-400 hover:text-default-700 rounded-full hover:bg-default-200 transition-colors"
                    title="مسح"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Action Buttons in Same Row */}
              <div className="flex items-center gap-1 shrink-0">
                <Tooltip content="توسيع الكل" placement="top">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-default-600 hover:text-primary bg-background hover:bg-default-100 transition-all border border-default-200/70 shadow-2xs"
                    aria-label="توسيع الكل"
                  >
                    <Maximize2 className="h-4 w-4 text-primary/80" />
                  </button>
                </Tooltip>

                <Tooltip content="طي الكل" placement="top">
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-default-600 hover:text-primary bg-background hover:bg-default-100 transition-all border border-default-200/70 shadow-2xs"
                    aria-label="طي الكل"
                  >
                    <Minimize2 className="h-4 w-4 text-default-500" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tree Navigation Container */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={`sidebar-tree-${portal}`} type="GROUP">
          {(provided) => (
            <nav
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 space-y-2 p-3 overflow-y-auto"
            >
              {/* Favorites Category Section */}
              {favoriteItems.length > 0 && !searchQuery.trim() && !sidebarCollapsed && (
                <div className="mb-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs md:text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span>المفضلة والوصول السريع</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {favoriteItems.map((item) => {
                      const Icon = item.icon;
                      const label = getItemLabel(item);
                      return (
                        <NavLink
                          key={`fav-${item.path}`}
                          to={item.path}
                          end={item.end}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center justify-between rounded-xl px-3 py-2 text-xs md:text-sm font-bold transition-all",
                              isActive
                                ? "text-amber-600 dark:text-amber-400 font-black bg-amber-500/20 shadow-2xs"
                                : "text-default-700 hover:bg-amber-500/10 hover:text-amber-900"
                            )
                          }
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className="h-4 w-4 shrink-0 text-amber-500" />
                            <span className="truncate">{label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(item.path, e)}
                            className="text-amber-400 hover:text-amber-600 p-0.5"
                            title="إزالة من المفضلة"
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </button>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Tree Groups */}
              {filteredGroups.map((group, groupIndex) => {
                const isExpanded = searchQuery.trim()
                  ? true
                  : expandedGroups[group.id] ?? true;

                const containsActiveChild = group.items.some(
                  (i) => i.path === location.pathname || (i.path !== "/" && location.pathname.startsWith(i.path))
                );

                return (
                  <Draggable
                    key={group.id}
                    draggableId={group.id}
                    index={groupIndex}
                    isDragDisabled={Boolean(searchQuery.trim())}
                  >
                    {(draggableProvided, snapshot) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        className={cn(
                          "rounded-2xl transition-all duration-200",
                          snapshot.isDragging &&
                            "z-50 shadow-xl scale-[1.02] bg-background border border-primary/40"
                        )}
                      >
                        {/* Group Node Header */}
                        {!sidebarCollapsed ? (
                          <div
                            className={cn(
                              "group/node flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer select-none",
                              containsActiveChild
                                ? "text-primary font-black bg-primary/5"
                                : "hover:bg-default-100/80"
                            )}
                            onClick={() => toggleGroup(group.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                {...draggableProvided.dragHandleProps}
                                onClick={(e) => e.stopPropagation()}
                                className="cursor-grab active:cursor-grabbing p-0.5 text-default-300 hover:text-default-600 opacity-0 group-hover/node:opacity-100 transition-opacity"
                                title="اسحب لإعادة ترتيب المجموعة"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <div className="flex items-center gap-2.5 min-w-0 flex-1 text-start">
                                {isExpanded ? (
                                  <FolderOpen
                                    className={cn(
                                      "h-4.5 w-4.5 shrink-0 transition-colors",
                                      containsActiveChild ? "text-primary fill-primary/20" : "text-primary/70"
                                    )}
                                  />
                                ) : (
                                  <Folder
                                    className={cn(
                                      "h-4.5 w-4.5 shrink-0 transition-colors",
                                      containsActiveChild ? "text-primary fill-primary/20" : "text-default-400"
                                    )}
                                  />
                                )}
                                <span
                                  className={cn(
                                    "text-xs md:text-sm font-extrabold truncate",
                                    containsActiveChild ? "text-primary font-black" : "text-foreground"
                                  )}
                                >
                                  {getGroupLabel(group)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="p-0.5 text-default-400 group-hover/node:text-default-700 transition-transform">
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform duration-200",
                                    !isExpanded && "-rotate-90 rtl:rotate-90"
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* Tree Child Items Branch with Authentic Tree Elbow Connectors (├─ / └─) */}
                        {(isExpanded || sidebarCollapsed) && (
                          <Droppable droppableId={`items-${group.id}`} type={`ITEM_${group.id}`}>
                            {(itemsProvided) => (
                              <div
                                ref={itemsProvided.innerRef}
                                {...itemsProvided.droppableProps}
                                className={cn(
                                  sidebarCollapsed
                                    ? "space-y-1.5"
                                    : "relative ms-6 ps-3 border-s-2 space-y-1.5 my-1.5 transition-colors",
                                  containsActiveChild ? "border-primary/50" : "border-default-200"
                                )}
                              >
                                {group.items.map((item, itemIndex) => {
                                  const Icon = item.icon;
                                  const label = getItemLabel(item);
                                  const isFav = favorites.includes(item.path);

                                  return (
                                    <Draggable
                                      key={item.path}
                                      draggableId={item.path}
                                      index={itemIndex}
                                      isDragDisabled={Boolean(searchQuery.trim()) || sidebarCollapsed}
                                    >
                                      {(itemDraggableProvided, itemSnapshot) => (
                                        <div
                                          ref={itemDraggableProvided.innerRef}
                                          {...itemDraggableProvided.draggableProps}
                                          className={cn(
                                            "relative flex items-center",
                                            itemSnapshot.isDragging &&
                                              "z-50 shadow-md scale-[1.02] bg-background border border-primary/30 rounded-xl"
                                          )}
                                        >
                                          {/* Horizontal Tree Elbow Connector Branch */}
                                          {!sidebarCollapsed && (
                                            <div
                                              className={cn(
                                                "absolute -start-[14px] top-1/2 w-3.5 h-[2px] transition-colors pointer-events-none",
                                                containsActiveChild ? "bg-primary/50" : "bg-default-300/70"
                                              )}
                                            />
                                          )}

                                          <Tooltip
                                            isDisabled={!sidebarCollapsed}
                                            content={label}
                                            placement={isRtl ? "left" : "right"}
                                          >
                                            <div className="group/item flex items-center w-full">
                                              {!sidebarCollapsed && (
                                                <div
                                                  {...itemDraggableProvided.dragHandleProps}
                                                  className="cursor-grab active:cursor-grabbing p-1 text-default-300 hover:text-default-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                  title="اسحب لإعادة الترتيب داخل المجموعة"
                                                >
                                                  <GripVertical className="h-3.5 w-3.5" />
                                                </div>
                                              )}

                                              <NavLink
                                                to={item.path}
                                                end={item.end}
                                                className={({ isActive }) =>
                                                  cn(
                                                    "relative flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm transition-all duration-200",
                                                    "hover:scale-[1.01] active:scale-[0.98]",
                                                    isActive
                                                      ? "text-primary font-black bg-primary/10 border-s-3 border-primary shadow-2xs"
                                                      : "text-default-700 hover:bg-default-100/80 hover:text-foreground font-bold",
                                                    sidebarCollapsed && "justify-center px-0 py-3"
                                                  )
                                                }
                                              >
                                                {({ isActive }) => (
                                                  <>
                                                    <Icon
                                                      className={cn(
                                                        "h-4.5 w-4.5 shrink-0 transition-transform group-hover/item:scale-110",
                                                        isActive
                                                          ? "text-primary fill-primary/20"
                                                          : "text-default-500 group-hover/item:text-foreground"
                                                      )}
                                                    />
                                                    {!sidebarCollapsed && (
                                                      <span
                                                        className={cn(
                                                          "truncate flex-1 text-xs md:text-sm",
                                                          isActive
                                                            ? "text-primary font-black"
                                                            : "text-default-800 font-bold"
                                                        )}
                                                      >
                                                        {label}
                                                      </span>
                                                    )}

                                                    {/* Favorite Star Toggle */}
                                                    {!sidebarCollapsed && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => toggleFavorite(item.path, e)}
                                                        className={cn(
                                                          "p-0.5 rounded transition-opacity",
                                                          isFav
                                                            ? "opacity-100 text-amber-400"
                                                            : "opacity-0 group-hover/item:opacity-100 text-default-400 hover:text-amber-400"
                                                        )}
                                                        title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                                                      >
                                                        <Star
                                                          className={cn(
                                                            "h-3.5 w-3.5",
                                                            isFav && "fill-current"
                                                          )}
                                                        />
                                                      </button>
                                                    )}

                                                    {item.path === "/chat" && (
                                                      <ChatInboxBadge
                                                        collapsed={sidebarCollapsed}
                                                        className={
                                                          isActive && !sidebarCollapsed
                                                            ? "bg-white text-primary"
                                                            : undefined
                                                        }
                                                      />
                                                    )}
                                                  </>
                                                )}
                                              </NavLink>
                                            </div>
                                          </Tooltip>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {itemsProvided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </nav>
          )}
        </Droppable>
      </DragDropContext>

      {/* Footer controls */}
      {portals.length > 1 && (
        <div className="border-t border-default-200/80 p-3 space-y-1.5 bg-default-50/60">
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={handleResetOrder}
              className="flex items-center justify-center gap-2 text-xs font-bold text-default-400 hover:text-foreground px-3 py-1.5 w-full rounded-xl transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة الترتيب الشجري الافتراضي</span>
            </button>
          )}

          <Tooltip
            isDisabled={!sidebarCollapsed}
            content={t("portals.allApps")}
            placement={isRtl ? "left" : "right"}
          >
            <button
              type="button"
              onClick={() => setPortalPickerOpen(true)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-extrabold transition-all",
                "text-default-700 hover:bg-default-200/60 hover:text-foreground",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <LayoutGrid className="h-4.5 w-4.5 shrink-0 text-primary" />
              {!sidebarCollapsed && (
                <span className="truncate">{t("portals.allApps")}</span>
              )}
            </button>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
