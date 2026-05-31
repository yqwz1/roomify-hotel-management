import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SuccessState = ({ title, message }) => {
  const { t } = useTranslation();

  return (
    <div className="roomify-hover-glow flex min-w-0 flex-col items-center justify-center rounded-3xl border border-brand-success/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(29,158,117,0.07))] p-8 text-center shadow-[0_20px_48px_-34px_rgba(29,158,117,0.45)]">
      <div className="roomify-success-burst mb-4 shrink-0 rounded-full bg-white p-3 text-brand-success shadow-sm ring-1 ring-brand-success/20">
        <CheckCircle2 className="h-8 w-8 shrink-0" />
      </div>
      <h3 className="mb-2 max-w-full break-words font-heading text-xl font-bold text-brand-ink">
        {title || t('successStateTitle')}
      </h3>
      <p className="max-w-md break-words text-brand-ink-muted">{message || t('successStateMessage')}</p>
    </div>
  );
};

export default SuccessState;
