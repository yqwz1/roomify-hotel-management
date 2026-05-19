import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ title, message, icon: Icon = Inbox }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-brand-surface-border bg-brand-surface-light p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-4 rounded-full bg-brand-primary-tint p-4 text-brand-primary shadow-sm ring-1 ring-brand-primary/15">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 font-heading text-lg font-bold text-brand-ink">
        {title || t('emptyStateTitle')}
      </h3>
      <p className="max-w-sm text-sm text-brand-ink-muted">
        {message || t('emptyStateMessage')}
      </p>
    </div>
  );
};

export default EmptyState;
