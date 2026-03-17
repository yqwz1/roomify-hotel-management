import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

const ErrorState = ({ title, message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-zinc-900" />
      <h3 className="mb-2 font-heading text-lg font-bold text-zinc-900">
        {title || t('errorStateTitle')}
      </h3>
      <p className="mb-6 max-w-md text-sm text-zinc-600">
        {message || t('errorStateMessage')}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100"
          onClick={onRetry}
        >
          {t('retry')}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
