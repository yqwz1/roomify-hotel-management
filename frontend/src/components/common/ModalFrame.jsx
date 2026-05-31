import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ModalFrame({
  title,
  description,
  children,
  onClose,
  closeLabel,
  widthClassName = 'max-w-lg',
}) {
  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) onClose?.();
    }}>
      <DialogContent
        closeLabel={closeLabel}
        className={`roomify-modal-pop min-w-0 ${widthClassName} overflow-hidden rounded-[1.75rem] border-black/5 bg-white p-0 shadow-2xl sm:rounded-[2rem]`}
      >
        <DialogHeader className="border-b border-brand-surface-border px-4 py-4 pe-14 text-start sm:px-6 sm:py-5">
          <DialogTitle className="text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1 text-sm font-medium text-brand-ink-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="max-h-[min(100dvh-10rem,42rem)] min-w-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
