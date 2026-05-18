import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoadingState = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[300px] p-8 text-center flex flex-col items-center justify-center">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-brand-ink" />
      <p className="font-medium text-brand-ink-muted">{message || t('loadingMessage')}</p>
    </div>
  );
};

export default LoadingState;
