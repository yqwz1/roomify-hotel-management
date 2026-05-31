import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoadingState = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="roomify-premium-card flex min-h-[300px] min-w-0 flex-col items-center justify-center rounded-[1.75rem] p-8 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary-tint text-brand-primary-deep shadow-sm">
        <Loader2 className="h-7 w-7 shrink-0 animate-spin" />
      </div>
      <p className="max-w-full break-words font-medium text-brand-ink-muted">{message || t('loadingMessage')}</p>
    </div>
  );
};

export default LoadingState;
