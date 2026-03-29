import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SuccessState = ({ title, message }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-center">
      <CheckCircle2 className="mb-4 h-12 w-12 text-zinc-900" />
      <h3 className="mb-2 font-heading text-xl font-bold text-zinc-900">
        {title || t('successStateTitle')}
      </h3>
      <p className="text-zinc-600">{message || t('successStateMessage')}</p>
    </div>
  );
};

export default SuccessState;
