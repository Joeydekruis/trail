import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { LIST_VIRTUAL_THRESHOLD, shouldVirtualizeList } from "./list-virtual-threshold";

type VirtualScrollListProps<T> = {
  items: T[];
  estimateSize: number;
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Scrollport; when omitted an internal ref is used. */
  scrollRef?: RefObject<HTMLDivElement | null>;
  threshold?: number;
  style?: CSSProperties;
};

function VirtualScrollListVirtualized<T>({
  items,
  estimateSize,
  getItemKey,
  renderItem,
  scrollRef,
  style,
}: Omit<VirtualScrollListProps<T>, "threshold">) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const parentRef = scrollRef ?? fallbackRef;
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
    getItemKey: (index) => getItemKey(items[index]!, index),
  });

  const ownsScroll = scrollRef === undefined;

  return (
    <div
      ref={ownsScroll ? parentRef : undefined}
      style={
        ownsScroll
          ? { overflow: "auto", minHeight: 0, ...style }
          : { position: "relative", width: "100%", ...style }
      }
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((vi) => (
          <div
            key={vi.key}
            data-index={vi.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start}px)`,
            }}
          >
            {renderItem(items[vi.index]!, vi.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VirtualScrollList<T>({
  items,
  estimateSize,
  getItemKey,
  renderItem,
  scrollRef,
  threshold = LIST_VIRTUAL_THRESHOLD,
  style,
}: VirtualScrollListProps<T>) {
  if (!shouldVirtualizeList(items.length, threshold)) {
    return (
      <div style={style}>
        {items.map((item, index) => (
          <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <VirtualScrollListVirtualized
      items={items}
      estimateSize={estimateSize}
      getItemKey={getItemKey}
      renderItem={renderItem}
      scrollRef={scrollRef}
      style={style}
    />
  );
}