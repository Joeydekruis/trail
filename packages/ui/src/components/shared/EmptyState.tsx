interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[#8b9cb6]">{icon}</div>}
      <h3 className="text-lg font-medium text-[#e2e8f0] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#8b9cb6] mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
