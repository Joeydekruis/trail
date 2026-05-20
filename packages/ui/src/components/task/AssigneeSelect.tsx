import { useMemo } from "react";
import { OptionalSelect } from "@/components/shared/OptionalSelect";
import { SelectItem } from "@/components/ui/select";
import { useAssignees } from "@/api/hooks";

interface AssigneeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Extra logins to show (e.g. current assignee not in repo list). */
  extraOptions?: string[];
}

export function AssigneeSelect({
  value,
  onValueChange,
  extraOptions = [],
}: AssigneeSelectProps) {
  const { data: repoAssignees = [] } = useAssignees();

  const options = useMemo(() => {
    const set = new Set<string>();
    for (const login of repoAssignees) {
      if (login.trim()) set.add(login);
    }
    for (const login of extraOptions) {
      if (login.trim()) set.add(login.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [repoAssignees, extraOptions]);

  return (
    <OptionalSelect
      value={value}
      onValueChange={onValueChange}
      placeholder="Unassigned"
    >
      {options.map((login) => (
        <SelectItem key={login} value={login}>
          {login}
        </SelectItem>
      ))}
    </OptionalSelect>
  );
}
