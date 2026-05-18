import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

const ErrorState = ({ title, message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-surface-border bg-brand-surface-light p-8 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-brand-ink" />
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
