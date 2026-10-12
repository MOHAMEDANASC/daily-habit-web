import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="card-soft rounded-3xl border bg-card p-6 sm:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      {footer ? <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
