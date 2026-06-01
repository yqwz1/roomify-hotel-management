import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin, Phone, Star, Wifi } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import HotelSourceBadge from '../components/hotels/HotelSourceBadge';
import { Button } from '../components/ui/button';
import {
  extractExternalHotelError,
  getExternalHotelDetails,
  getExternalHotelPhotoUrl,
} from '../services/externalHotelService';

function ExternalHotelImagePlaceholder({ name }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#eef4f8_0%,#d7e6ef_100%)] px-6 text-center text-brand-ink">
      <MapPin className="h-11 w-11 text-brand-primary" />
      <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-ink-muted">
        {t('exploreHotels.placeholderImage')}
      </p>
      <p className="line-clamp-2 text-xl font-black">{name}</p>
    </div>
  );
}

export default function ExternalHotelDetails() {
  const { placeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hotel, setHotel] = useState(location.state?.hotel ?? null);
  const [loading, setLoading] = useState(!location.state?.hotel);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadHotel = async () => {
      setLoading(true);
      setError('');
      try {
        const details = await getExternalHotelDetails(placeId);
        if (!ignore) setHotel(details);
      } catch (err) {
        if (!ignore) setError(extractExternalHotelError(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadHotel();

    return () => {
      ignore = true;
    };
  }, [placeId]);

  const photoUrl = useMemo(() => {
    if (!hotel?.photoName) return '';
    return getExternalHotelPhotoUrl(hotel.placeId ?? placeId, hotel.photoName);
  }, [hotel, placeId]);

  if (loading) {
    return <LoadingState message={t('exploreHotels.loading')} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('exploreHotels.detailsTitle')}
        message={error}
        onRetry={() => navigate(0)}
      />
    );
  }

  if (!hotel) {
    return (
      <ErrorState
        title={t('exploreHotels.detailsTitle')}
        message={t('exploreHotels.noResults')}
        onRetry={() => navigate('/explore-hotels')}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t('exploreHotels.externalBadge')}
        title={hotel.name}
        description={hotel.address}
        meta={[
          hotel.rating ? t('exploreHotels.ratingValue', { rating: hotel.rating }) : t('exploreHotels.rating'),
          hotel.userRatingCount ? t('exploreHotels.reviewCount', { count: hotel.userRatingCount }) : t('exploreHotels.reviews'),
          t('exploreHotels.viewOnly'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <HotelSourceBadge source="GOOGLE_MAPS" />
          <p className="mt-3 text-sm font-medium leading-6 text-white/80">
            {t('exploreHotels.externalViewOnlyNote')}
          </p>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel title={t('exploreHotels.detailsTitle')} description={t('exploreHotels.detailsDescription')}>
          <div className="space-y-5">
            <div className="h-72 overflow-hidden rounded-[1.5rem] bg-brand-primary-tint">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={t('exploreHotels.photoAlt', { name: hotel.name })}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/roomify-mark.png';
                    event.currentTarget.className = 'h-full w-full bg-brand-primary-tint object-contain p-16';
                  }}
                />
              ) : (
                <ExternalHotelImagePlaceholder name={hotel.name} />
              )}
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-ink-hint">
                  {t('exploreHotels.rating')}
                </p>
                <p className="mt-2 inline-flex min-w-0 items-center gap-1.5 text-sm font-bold text-brand-ink">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {hotel.rating ?? t('common.pending')}
                </p>
              </div>
              <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-ink-hint">
                  {t('exploreHotels.reviews')}
                </p>
                <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                  {hotel.userRatingCount ?? t('exploreHotels.noRatingCount')}
                </p>
              </div>
              <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-ink-hint">
                  {t('exploreHotels.source')}
                </p>
                <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                  {t('exploreHotels.externalBadge')}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-5">
              <p className="flex min-w-0 items-start gap-2 text-sm font-medium leading-6 text-brand-ink-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink-hint" />
                <span className="break-words">{hotel.address}</span>
              </p>
              {hotel.internationalPhoneNumber ? (
                <p className="mt-3 flex min-w-0 items-center gap-2 text-sm font-medium text-brand-ink-muted">
                  <Phone className="h-4 w-4 shrink-0 text-brand-ink-hint" />
                  <span className="break-words">{hotel.internationalPhoneNumber}</span>
                </p>
              ) : null}
              {hotel.websiteUri ? (
                <p className="mt-3 flex min-w-0 items-center gap-2 text-sm font-medium text-brand-ink-muted">
                  <Wifi className="h-4 w-4 shrink-0 text-brand-ink-hint" />
                  <a className="break-words text-brand-primary hover:underline" href={hotel.websiteUri} target="_blank" rel="noreferrer">
                    {hotel.websiteUri}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/explore-hotels')}
                className="h-auto min-w-0 flex-1 rounded-full border-brand-surface-border py-3 leading-normal text-brand-ink hover:bg-brand-surface-light hover:text-brand-ink transition shadow-sm"
              >
                {t('exploreHotels.backToExplore')}
              </Button>
              {hotel.googleMapsUri ? (
                <Button asChild className="h-auto min-w-0 flex-1 rounded-full py-3 leading-normal bg-brand-primary hover:bg-brand-primary-deep text-white transition shadow-sm">
                  <a href={hotel.googleMapsUri} target="_blank" rel="noreferrer">
                    {t('exploreHotels.viewOnGoogleMaps')}
                    <ExternalLink className="ms-2 h-4 w-4 shrink-0" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title={t('exploreHotels.reviews')} description={t('exploreHotels.reviewsDescription')}>
          <div className="space-y-4">
            {(hotel.reviews ?? []).length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center text-sm font-medium text-brand-ink-muted">
                <p>{t('exploreHotels.noReviews')}</p>
                {hotel.googleMapsUri ? (
                  <Button asChild variant="outline" className="mt-5 h-auto rounded-full border-brand-surface-border py-2.5 leading-normal text-brand-ink hover:bg-brand-surface-light hover:text-brand-ink transition shadow-sm">
                    <a href={hotel.googleMapsUri} target="_blank" rel="noreferrer">
                      {t('exploreHotels.viewReviewsOnGoogleMaps')}
                      <ExternalLink className="ms-2 h-4 w-4 shrink-0" />
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : (
              hotel.reviews.map((review, index) => (
                <article key={`${review.authorName}-${index}`} className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-brand-ink break-words">{review.authorName || t('guest')}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink-hint break-words">
                        {review.relativePublishTimeDescription}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-brand-ink">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {review.rating ?? '-'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                    {review.text}
                  </p>
                </article>
              ))
            )}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
