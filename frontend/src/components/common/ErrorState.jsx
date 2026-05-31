import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

const ErrorState = ({ title, message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="roomify-hover-glow flex min-w-0 flex-col items-center justify-center rounded-3xl border border-brand-danger/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(163,45,45,0.06))] p-8 text-center shadow-[0_20px_48px_-34px_rgba(163,45,45,0.45)]">
      <div className="mb-4 shrink-0 rounded-full bg-white p-3 text-brand-danger shadow-sm ring-1 ring-brand-danger/20">
        <AlertCircle className="h-8 w-8 shrink-0" />
      </div>
      <h3 className="mb-2 max-w-full break-words font-heading text-lg font-bold text-brand-ink">
        {title || t('errorStateTitle')}
      </h3>
      <p className="mb-6 max-w-md break-words text-sm text-brand-ink-muted">
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
