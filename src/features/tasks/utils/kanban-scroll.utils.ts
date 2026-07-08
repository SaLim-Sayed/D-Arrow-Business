import type { TaskStatus } from "../types/task.types";

const SCROLL_EDGE = 80;
const SCROLL_SPEED = 14;

export function scrollHorizontalBy(
  el: HTMLElement,
  direction: "start" | "end",
  amount = 320
) {
  const isRtl = getComputedStyle(el).direction === "rtl";
  const delta =
    direction === "start"
      ? isRtl
        ? amount
        : -amount
      : isRtl
        ? -amount
        : amount;

  el.scrollBy({ left: delta, behavior: "smooth" });
}

export function scrollVerticalBy(
  el: HTMLElement,
  direction: "up" | "down",
  amount = 180
) {
  const delta = direction === "up" ? -amount : amount;
  el.scrollBy({ top: delta, behavior: "smooth" });
}

export function scrollElementIntoInlineCenter(el: HTMLElement) {
  el.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest",
  });
}

export function getHorizontalScrollEdges(el: HTMLElement) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 2) {
    return { start: false, end: false, maxScroll: 0, scrollPos: 0 };
  }

  const scrollPos = Math.min(Math.abs(el.scrollLeft), maxScroll);
  return {
    start: scrollPos > 4,
    end: scrollPos < maxScroll - 4,
    maxScroll,
    scrollPos,
  };
}

export function getVerticalScrollEdges(el: HTMLElement) {
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 2) {
    return { top: false, bottom: false };
  }

  return {
    top: el.scrollTop > 4,
    bottom: el.scrollTop < maxScroll - 4,
  };
}

export function autoScrollKanbanPointer(
  pointer: { x: number; y: number },
  horizontalEl: HTMLElement | null,
  columnBodies: Partial<Record<TaskStatus, HTMLDivElement | null>>
) {
  if (horizontalEl) {
    const rect = horizontalEl.getBoundingClientRect();
    const isRtl = getComputedStyle(horizontalEl).direction === "rtl";

    if (pointer.x < rect.left + SCROLL_EDGE) {
      horizontalEl.scrollLeft += isRtl ? SCROLL_SPEED : -SCROLL_SPEED;
    } else if (pointer.x > rect.right - SCROLL_EDGE) {
      horizontalEl.scrollLeft += isRtl ? -SCROLL_SPEED : SCROLL_SPEED;
    }
  }

  for (const col of Object.values(columnBodies)) {
    if (!col) continue;
    const rect = col.getBoundingClientRect();
    if (
      pointer.x < rect.left ||
      pointer.x > rect.right ||
      pointer.y < rect.top ||
      pointer.y > rect.bottom
    ) {
      continue;
    }

    if (pointer.y < rect.top + SCROLL_EDGE) {
      col.scrollTop -= SCROLL_SPEED;
    } else if (pointer.y > rect.bottom - SCROLL_EDGE) {
      col.scrollTop += SCROLL_SPEED;
    }
    break;
  }
}

export function getHorizontalScrollProgress(el: HTMLElement) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 2) return 0;
  return Math.min(1, Math.abs(el.scrollLeft) / maxScroll);
}

export function scrollHorizontalToProgress(el: HTMLElement, progress: number) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 2) return;
  el.scrollLeft = maxScroll * Math.min(1, Math.max(0, progress));
}

export function bindKanbanWheelScroll(horizontalEl: HTMLElement) {
  const onWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const columnScroll = target.closest(".kanban-column-scroll");
    if (columnScroll instanceof HTMLElement) {
      const { scrollTop, scrollHeight, clientHeight } = columnScroll;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) {
        return;
      }
    }

    event.preventDefault();
    const isRtl = getComputedStyle(horizontalEl).direction === "rtl";
    horizontalEl.scrollLeft += isRtl ? -event.deltaY : event.deltaY;
  };

  horizontalEl.addEventListener("wheel", onWheel, { passive: false });
  return () => horizontalEl.removeEventListener("wheel", onWheel);
}
