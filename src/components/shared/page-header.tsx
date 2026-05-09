interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <div className="flex gap-2">
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          <h1 className="text-3xl font-black tracking-tight text-gradient">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm font-medium text-default-500 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
