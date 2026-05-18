import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SuccessState = ({ title, message }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-surface-border bg-brand-surface-light p-8 text-center">
      <CheckCircle2 className="mb-4 h-12 w-12 text-brand-ink" />
      <h3 className="mb-2 font-heading text-xl font-bold text-brand-ink">
        {title || t('successStateTitle')}
      </h3>
      <p className="text-brand-ink-muted">{message || t('successStateMessage')}</p>
    </div>
  );
};

export default SuccessState;
