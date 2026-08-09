import { useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 96;

/**
 * Sticky-bottom chat scrolling: auto-follows new messages only while the
 * user is near the bottom; otherwise surfaces a jump-to-latest control.
 */
export function useChatScroll(resetKey: string | undefined, followKey: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    stickToBottom.current = true;
    setShowJump(false);
  }, []);

  const onScroll = useCallback(() => {
    const near = isNearBottom();
    stickToBottom.current = near;
    setShowJump(!near);
  }, [isNearBottom]);

  // New conversation: pin to the latest message immediately.
  useEffect(() => {
    stickToBottom.current = true;
    setShowJump(false);
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [resetKey, scrollToBottom]);

  // New messages / typing rows: follow only when already near the bottom.
  useEffect(() => {
    if (!stickToBottom.current) {
      setShowJump(true);
      return;
    }
    requestAnimationFrame(() => scrollToBottom("smooth"));
  }, [followKey, scrollToBottom]);

  return {
    containerRef,
    bottomRef,
    showJump,
    onScroll,
    scrollToBottom,
  };
}
