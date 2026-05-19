import { X } from 'lucide-react';

export default function ModalFrame({
  title,
  description,
  children,
  onClose,
  closeLabel,
  widthClassName = 'max-w-lg',
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className={`w-full ${widthClassName} rounded-[2rem] border border-black/5 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-brand-surface-border px-6 py-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-brand-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm font-medium text-brand-ink-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-surface-border p-2 text-brand-ink-muted transition hover:bg-brand-surface-light hover:text-brand-ink"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
