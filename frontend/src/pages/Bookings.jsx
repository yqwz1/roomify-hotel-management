import { useTranslation } from 'react-i18next';

export default function Bookings() {
  const { t } = useTranslation();
  return (
    <div className="h-full bg-zinc-50 p-6 lg:p-8">
      <h1 className="text-4xl font-extrabold text-black tracking-tight mb-2">{t('bookings')}</h1>
      <p className="text-zinc-500 font-medium">{t('viewAndManageBookings')}</p>
    </div>
  )
}
