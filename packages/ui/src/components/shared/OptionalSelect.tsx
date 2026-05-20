import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SELECT_NONE } from "@/components/shared/FormField";
import { cn } from "@/lib/utils";

interface OptionalSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
  children: React.ReactNode;
}

export function OptionalSelect({
  value,
  onValueChange,
  placeholder,
  className,
  children,
}: OptionalSelectProps) {
  return (
    <Select
      value={value || SELECT_NONE}
      onValueChange={(v) => onValueChange(v === SELECT_NONE ? "" : v)}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
        <SelectItem value={SELECT_NONE}>{placeholder}</SelectItem>
      </SelectContent>
    </Select>
  );
}
