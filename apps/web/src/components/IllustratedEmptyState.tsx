import type { ReactNode } from "react";

export function IllustratedEmptyState({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <section className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <span>RD$</span>
        <i />
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="button-row">{action}</div>
      </div>
    </section>
  );
}
