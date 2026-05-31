import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ReservationDetailLoader } from '../components/reservations/ReservationDetailContent';
import {
  buildReservationWorkspaceQueueContext,
} from '../utils/reservationWorkspace';
import { buildReservationLookupNavigationState } from '../utils/reservationLookup';

export default function ReservationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { confirmationNumber: routeConfirmation } = useParams();
  const { t, i18n } = useTranslation();

  const confirmationNumber = useMemo(() => {
    const fromState = location.state?.confirmationNumber;
    return String(fromState ?? routeConfirmation ?? '').trim();
  }, [location.state?.confirmationNumber, routeConfirmation]);

  const queueSearch = searchParams.toString();
  const queueBasePath = location.state?.fromQueuePath ?? '/reservations';
  const queueReturnPath = `${queueBasePath}${queueSearch ? `?${queueSearch}` : ''}`;
  const queueContext = useMemo(
    () => buildReservationWorkspaceQueueContext(searchParams, t, i18n.language),
    [i18n.language, searchParams, t]
  );

  const handleAction = (action, reservation) => {
    switch (action) {
      case 'checkIn':
        navigate('/check-in', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      case 'payment':
        navigate('/checkout', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation, workflowIntent: 'payment' }
          ),
        });
        break;
      case 'modify':
        navigate('/reservations/modify', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      case 'cancel':
        navigate('/reservations/cancel', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      case 'checkout':
        navigate('/checkout', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation, workflowIntent: 'checkout' }
          ),
        });
        break;
      case 'invoice':
        navigate('/invoice-preview', {
          state: buildReservationLookupNavigationState(
            { confirmation: reservation.confirmationNumber },
            { initialReservation: reservation }
          ),
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="roomify-page-enter mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <ReservationDetailLoader
        confirmationNumber={confirmationNumber}
        queueContext={queueContext}
        onBack={() => navigate(queueReturnPath)}
        onAction={handleAction}
        variant="page"
      />
    </div>
  );
}
