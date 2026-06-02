import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ title, message, icon: Icon = Inbox }) => {
  const { t } = useTranslation();

  return (
    <div className="motion-slide-up flex min-w-0 flex-col items-center justify-center rounded-3xl border border-brand-surface-border bg-brand-surface-light p-8 text-center sm:p-12">
      <div className="mb-4 shrink-0 rounded-full bg-brand-primary-tint p-4 text-brand-primary shadow-sm ring-1 ring-brand-primary/15">
        <Icon className="h-8 w-8 shrink-0" />
      </div>
      <h3 className="mb-2 max-w-full break-words font-heading text-lg font-bold text-brand-ink">
        {title || t('emptyStateTitle')}
      </h3>
      <p className="max-w-sm break-words text-sm text-brand-ink-muted">
        {message || t('emptyStateMessage')}
      </p>
    </div>
  );
};

export default EmptyState;
