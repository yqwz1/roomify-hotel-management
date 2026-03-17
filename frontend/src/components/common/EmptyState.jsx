import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ title, message, icon: Icon = Inbox }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-4 rounded-full bg-white p-4 text-zinc-400 shadow-sm">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 font-heading text-lg font-bold text-zinc-900">
        {title || t('emptyStateTitle')}
      </h3>
      <p className="max-w-sm text-sm text-zinc-500">
        {message || t('emptyStateMessage')}
      </p>
    </div>
  );
};

export default EmptyState;
