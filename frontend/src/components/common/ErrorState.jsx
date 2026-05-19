import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

const ErrorState = ({ title, message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-danger/25 bg-brand-danger/[0.05] p-8 text-center">
      <div className="mb-4 rounded-full bg-white p-3 text-brand-danger shadow-sm ring-1 ring-brand-danger/20">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="mb-2 font-heading text-lg font-bold text-brand-ink">
        {title || t('errorStateTitle')}
      </h3>
      <p className="mb-6 max-w-md text-sm text-brand-ink-muted">
        {message || t('errorStateMessage')}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="rounded-full border-brand-surface-border text-brand-ink hover:bg-brand-primary-tint"
          onClick={onRetry}
        >
          {t('retry')}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
