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
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm font-medium text-zinc-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-black"
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
