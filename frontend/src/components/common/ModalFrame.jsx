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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div
        className={`mt-4 w-full ${widthClassName} overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-2xl sm:mt-0 sm:rounded-[2rem]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-surface-border px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-brand-ink sm:text-2xl">{title}</h2>
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
        <div className="max-h-[min(100dvh-10rem,42rem)] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
