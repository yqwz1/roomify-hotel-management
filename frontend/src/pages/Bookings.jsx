import { useTranslation } from 'react-i18next';

export default function Bookings() {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('bookings')}</h1>
      <p className="text-gray-600">{t('viewAndManageBookings')}</p>
    </div>
  )
}