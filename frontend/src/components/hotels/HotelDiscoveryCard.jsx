import { ArrowRight, ExternalLink, MapPin, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import HotelSourceBadge from './HotelSourceBadge';

function HotelImagePlaceholder({ name }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#eef4f8_0%,#d7e6ef_100%)] px-6 text-center text-brand-ink">
      <MapPin className="h-9 w-9 text-brand-primary" />
      <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-ink-muted">
        {t('exploreHotels.placeholderImage')}
      </p>
      <p className="line-clamp-2 text-base font-black">{name}</p>
    </div>
  );
}

export default function HotelDiscoveryCard({ hotel, onBook, onViewDetails }) {
  const { t } = useTranslation();
  const isRoomify = hotel.source === 'ROOMIFY';
  const imageAlt = t('exploreHotels.photoAlt', { name: hotel.name });

  return (
    <article
      className={`motion-stagger-item motion-card-hover overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.26)] ${
        isRoomify ? 'border-brand-primary/30' : 'border-brand-success/30'
      }`}
    >
      <div className="relative h-48 bg-brand-primary-tint">
        {hotel.photoUrl || isRoomify ? (
          <img
            src={hotel.photoUrl || '/roomify-mark.png'}
            alt={imageAlt}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = '/roomify-mark.png';
              event.currentTarget.className = 'h-full w-full bg-brand-primary-tint object-contain p-12';
            }}
          />
        ) : (
          <HotelImagePlaceholder name={hotel.name} />
        )}
        <div className="absolute start-4 top-4">
          <HotelSourceBadge source={hotel.source} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-tight text-brand-ink break-words">
            {hotel.name}
          </h3>
          <p className="mt-2 flex min-w-0 items-start gap-2 text-sm font-medium leading-6 text-brand-ink-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink-hint" />
            <span className="break-words">{hotel.address || t('exploreHotels.addressUnavailable')}</span>
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3">
          <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-ink-hint">
              {t('exploreHotels.rating')}
            </p>
            <p className="mt-1 inline-flex min-w-0 items-center gap-1.5 text-sm font-bold text-brand-ink">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {hotel.rating ?? t('common.pending')}
            </p>
          </div>
          <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-ink-hint">
              {t('exploreHotels.reviews')}
            </p>
            <p className="mt-1 text-sm font-bold text-brand-ink break-words">
              {hotel.userRatingCount ?? t('exploreHotels.noRatingCount')}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2.5 border-t border-brand-surface-border pt-4">
          {isRoomify ? (
            <Button
              type="button"
              onClick={() => onBook?.(hotel)}
              className="h-auto w-full rounded-full py-2.5 px-5 leading-normal bg-brand-primary hover:bg-brand-primary-deep text-white transition shadow-sm"
            >
              {t('exploreHotels.bookNow')}
              <ArrowRight className="ms-2 h-4 w-4 shrink-0 rtl:rotate-180" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => onViewDetails?.(hotel)}
                className="h-auto w-full rounded-full py-2.5 px-5 leading-normal bg-brand-primary hover:bg-brand-primary-deep text-white transition shadow-sm"
              >
                {t('exploreHotels.viewDetails')}
              </Button>
              {hotel.googleMapsUri ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-auto w-full rounded-full border-brand-surface-border py-2.5 px-5 leading-normal text-brand-ink hover:bg-brand-surface-light hover:text-brand-ink transition shadow-sm"
                >
                  <a href={hotel.googleMapsUri} target="_blank" rel="noreferrer">
                    {t('exploreHotels.viewOnGoogleMaps')}
                    <ExternalLink className="ms-2 h-4 w-4 shrink-0" />
                  </a>
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
