import { Search } from "lucide-react";

interface SearchBarProps {
  onSelect: (taskId: string) => void;
}

export function SearchBar({ onSelect: _onSelect }: SearchBarProps) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8b9cb6]" />
      <input
        type="text"
        placeholder="Search tasks..."
        className="w-56 rounded-md border border-[#1e2d3d] bg-[#111827] py-1.5 pl-8 pr-3 text-sm text-[#e2e8f0] placeholder-[#8b9cb6]/50 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
