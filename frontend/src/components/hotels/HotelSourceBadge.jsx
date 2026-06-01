import { Map, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HotelSourceBadge({ source }) {
  const { t } = useTranslation();
  const isRoomify = source === 'ROOMIFY';
  const Icon = isRoomify ? ShieldCheck : Map;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
        isRoomify
          ? 'border-brand-primary/25 bg-brand-primary text-white'
          : 'border-brand-success/30 bg-brand-success/10 text-brand-success'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {isRoomify ? t('exploreHotels.roomifyBadge') : t('exploreHotels.externalBadge')}
      </span>
    </span>
  );
}
