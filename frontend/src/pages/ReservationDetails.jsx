import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import StatusPill from '../components/StatusPill'
import { LtrText } from '../components/LtrText'
import { getReservationByConfirmationNumber, extractReservationError } from '../services/reservationService'
import { reservationStatusRules } from '../domain/reservations/statusRules'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`

export default function ReservationDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const { confirmationNumber: routeConfirmation } = useParams()

  const confirmationNumber = useMemo(() => {
    const fromState = location.state?.confirmationNumber
    return String(fromState ?? routeConfirmation ?? '').trim()
  }, [location.state?.confirmationNumber, routeConfirmation])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    const run = async () => {
      if (!confirmationNumber) {
        setError('Missing confirmation number.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const r = await getReservationByConfirmationNumber(confirmationNumber)
        setReservation(r)
      } catch (err) {
        setError(extractReservationError(err))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [confirmationNumber])

  if (loading) return <LoadingState message="Loading reservation details..." />
  if (error) return <ErrorState title="Could not load reservation" message={error} onRetry={() => navigate(0)} />
  if (!reservation) return <ErrorState title="Reservation not found" message="No reservation data is available." />

  return (
    <div className="h-full bg-zinc-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-black">Reservation Details</h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Confirmation <span className="font-mono font-bold text-zinc-700"><LtrText>{reservation.confirmationNumber}</LtrText></span>
            </p>
          </div>
          <StatusPill status={reservation.status} />
        </div>

        <Card className="rounded-3xl border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-black">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Guest</dt>
                <dd className="mt-1 font-bold text-black">{reservation.guestName || '—'}</dd>
                <dd className="text-zinc-500">{reservation.guestEmail || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Room</dt>
                <dd className="mt-1 font-bold text-black">Room {reservation.roomNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Check-in</dt>
                <dd className="mt-1 font-bold text-black">{formatDate(reservation.checkInDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Check-out</dt>
                <dd className="mt-1 font-bold text-black">{formatDate(reservation.checkOutDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Nights</dt>
                <dd className="mt-1 font-bold text-black">{reservation.nights ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Total</dt>
                <dd className="mt-1 font-extrabold text-rose-900">{money(reservation.totalPrice)}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100"
                onClick={() => navigate('/invoice-preview', { state: { confirmationNumber: reservation.confirmationNumber } })}
              >
                View Invoice
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100"
                onClick={() => navigate('/checkout', { state: { initialQuery: reservation.confirmationNumber } })}
                disabled={!reservationStatusRules.canCheckOut(reservation.status)}
                title={!reservationStatusRules.canCheckOut(reservation.status) ? 'Checkout is only available for CHECKED_IN reservations.' : undefined}
              >
                Go to Checkout
              </Button>
              <Button
                className="rounded-full bg-black hover:bg-zinc-800 text-white"
                onClick={() => navigate('/check-in', { state: { initialQuery: reservation.confirmationNumber } })}
                disabled={!reservationStatusRules.canCheckIn(reservation.status)}
                title={!reservationStatusRules.canCheckIn(reservation.status) ? 'Check-in is only available for CONFIRMED reservations.' : undefined}
              >
                Go to Check-In
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100"
                onClick={() => navigate('/reservations/modify', { state: { initialQuery: reservation.confirmationNumber } })}
                disabled={!reservationStatusRules.canModify(reservation.status)}
              >
                Modify
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => navigate('/reservations/cancel', { state: { initialQuery: reservation.confirmationNumber } })}
                disabled={!reservationStatusRules.canCancel(reservation.status)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

