import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoadingState = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="motion-fade-in motion-skeleton-shimmer-premium flex min-h-[300px] min-w-0 flex-col items-center justify-center rounded-3xl p-8 text-center">
      <Loader2 className="mb-4 h-8 w-8 shrink-0 animate-spin text-brand-primary" />
      <p className="max-w-full break-words font-medium text-brand-ink-muted">{message || t('loadingMessage')}</p>
    </div>
  );
};

export default LoadingState;
