import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SuccessState = ({ title, message }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-success/25 bg-brand-success/[0.05] p-8 text-center">
      <div className="mb-4 rounded-full bg-white p-3 text-brand-success shadow-sm ring-1 ring-brand-success/20">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="mb-2 font-heading text-xl font-bold text-brand-ink">
        {title || t('successStateTitle')}
      </h3>
      <p className="text-brand-ink-muted">{message || t('successStateMessage')}</p>
    </div>
  );
};

export default SuccessState;
