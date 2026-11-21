/** Lists longer than this render via @tanstack/react-virtual (performance briefing). */
export const LIST_VIRTUAL_THRESHOLD = 100;

export function shouldVirtualizeList(
  itemCount: number,
  threshold: number = LIST_VIRTUAL_THRESHOLD,
): boolean {
  return itemCount > threshold;
}