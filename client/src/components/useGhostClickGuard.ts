import { useEffect, useRef } from "react";

/**
 * When a panel appears under the finger at the start of a tap, the end of that same tap
 * can "click" whatever button is now there. Ignore clicks for a moment after the panel opens.
 */
export function useGhostClickGuard(key: unknown, ms = 450) {
  const openedAt = useRef(0);
  useEffect(() => { openedAt.current = Date.now(); }, [key]);
  return (e: React.MouseEvent) => {
    if (Date.now() - openedAt.current < ms) { e.preventDefault(); e.stopPropagation(); }
  };
}
