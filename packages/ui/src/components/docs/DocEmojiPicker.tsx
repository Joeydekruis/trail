import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_EMOJIS = [
  "📄", "📝", "📋", "📌", "📎", "🗒️", "📁", "🗂️",
  "💡", "🎯", "🚀", "⚙️", "🔧", "🐛", "✨", "🔥",
  "✅", "❌", "⚠️", "💬", "📊", "📈", "🧪", "🏗️",
  "👤", "👥", "🤖", "💻", "🌐", "🔒", "📦", "🎨",
];

interface DocEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function DocEmojiPicker({ value, onChange, className }: DocEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function pick(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  function applyCustom() {
    const trimmed = custom.trim();
    if (trimmed) pick(trimmed);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-9 w-9 shrink-0 text-lg", className)}
          aria-label="Change icon"
        >
          {value || <Smile size={16} className="text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-0.5">
          {PRESET_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted",
                value === emoji && "bg-primary/15 ring-1 ring-primary/30",
              )}
              onClick={() => pick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Paste emoji…"
            className="h-8 text-sm"
            maxLength={8}
          />
          <Button type="button" size="sm" variant="secondary" onClick={applyCustom}>
            Set
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
