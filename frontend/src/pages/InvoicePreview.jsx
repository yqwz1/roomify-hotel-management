import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Printer, Hotel, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import ConfirmationToast from '../components/ConfirmationToast'
import { getInvoiceDeliveryStatus, getInvoicePdf } from '../services/invoiceService'
import {
  extractReservationError,
  getBill,
  getReservationByConfirmationNumber,
} from '../services/reservationService'

const formatDateAr = (iso) => {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatAmount = (val) => {
  const n = Number(val ?? 0)
  return `$${n.toFixed(2)}`
}

const InvoicePreview = () => {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [reservation, setReservation] = useState(null)
  const [bill, setBill] = useState(null)

  const [deliveryStatus, setDeliveryStatus] = useState('IDLE') // IDLE | LOADING | SENT | FAILED | UNKNOWN | ERROR
  const [deliveryMeta, setDeliveryMeta] = useState({ errorMessage: null, sentAt: null })

  const [downloading, setDownloading] = useState(false)

  const reservationId = reservation?.id
  const confirmationNumber = reservation?.confirmationNumber

  const fetchEverything = useCallback(async (confirmation) => {
    const trimmed = String(confirmation ?? '').trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setReservation(null)
    setBill(null)
    setDeliveryStatus('LOADING')
    setDeliveryMeta({ errorMessage: null, sentAt: null })

    try {
      const r = await getReservationByConfirmationNumber(trimmed)
      setReservation(r)

      const b = await getBill(r.confirmationNumber)
      setBill(b)

      try {
        const ds = await getInvoiceDeliveryStatus(r.id)
        setDeliveryStatus(ds?.status || 'UNKNOWN')
        setDeliveryMeta({ errorMessage: ds?.errorMessage ?? null, sentAt: ds?.sentAt ?? null })
      } catch (err) {
        if (err?.response?.status === 404) {
          setDeliveryStatus('UNKNOWN')
          setDeliveryMeta({ errorMessage: null, sentAt: null })
        } else {
          setDeliveryStatus('ERROR')
          setDeliveryMeta({ errorMessage: null, sentAt: null })
        }
      }
    } catch (err) {
      setError(extractReservationError(err))
      setDeliveryStatus('IDLE')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = String(location.state?.confirmationNumber ?? '').trim()
    if (!initial) return
    setQuery(initial)
    fetchEverything(initial)
  }, [location.state?.confirmationNumber, fetchEverything])

  const handleSearch = async (e) => {
    e.preventDefault()
    await fetchEverything(query)
  }

  const handleDownload = useCallback(async () => {
    if (!reservationId || downloading) return
    try {
      setDownloading(true)
      const blob = await getInvoicePdf(reservationId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${reservationId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setToast({ message: 'تعذر تحميل الفاتورة. حاول مرة أخرى.', type: 'error' })
    } finally {
      setDownloading(false)
    }
  }, [reservationId, downloading])

  const handlePrint = useCallback(async () => {
    if (!reservationId) return
    try {
      const blob = await getInvoicePdf(reservationId)
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url)
      if (printWindow) printWindow.focus()
    } catch (err) {
      setToast({ message: 'تعذر فتح الفاتورة للطباعة. حاول مرة أخرى.', type: 'error' })
    }
  }, [reservationId])

  const deliveryBadge = useMemo(() => {
    if (!reservationId) {
      return (
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
          ابحث عن حجز لعرض الفاتورة
        </span>
      )
    }

    if (deliveryStatus === 'LOADING') {
      return (
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
          جاري تحميل حالة إرسال الفاتورة...
        </span>
      )
    }

    if (deliveryStatus === 'ERROR') {
      return (
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-rose-100 text-rose-900">
          تعذر جلب حالة إرسال البريد الإلكتروني.
        </span>
      )
    }

    if (deliveryStatus === 'SENT') {
      return (
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-rose-900/10 text-rose-900">
          تم إرسال الفاتورة إلى البريد الإلكتروني
        </span>
      )
    }

    if (deliveryStatus === 'FAILED') {
      return (
        <span className="inline-flex flex-col sm:flex-row sm:items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium bg-rose-100 text-rose-900">
          <span>فشل إرسال الفاتورة إلى البريد الإلكتروني</span>
          {deliveryMeta.errorMessage && (
            <span className="text-[11px] text-rose-800">({deliveryMeta.errorMessage})</span>
          )}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
        لم يتم إرسال الفاتورة بعد
      </span>
    )
  }, [reservationId, deliveryStatus, deliveryMeta.errorMessage])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <Card className="rounded-3xl border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span
              className="text-2xl font-bold text-rose-900 me-2"
              style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}
            >
              معاينة الفاتورة
            </span>
            <div>{deliveryBadge}</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setError(null)
                }}
                placeholder="رقم التأكيد (مثلاً RSV-...)"
                className="pe-10 rounded-full border-zinc-300 focus-visible:ring-rose-900"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-full bg-rose-900 hover:bg-rose-900/90 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </Button>
          </form>

          {error && (
            <div className="mt-4">
              <ErrorState title="تعذر تحميل الفاتورة" message={error} onRetry={() => fetchEverything(query)} />
            </div>
          )}
        </CardContent>
      </Card>

      {loading && <LoadingState message="جاري تحميل بيانات الفاتورة..." />}

      {!loading && reservation && bill && (
        <>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-full border-rose-900/10 text-rose-900 hover:bg-rose-900 hover:text-white"
              onClick={handlePrint}
              disabled={!reservationId}
            >
              طباعة
            </Button>
            <Button
              className="flex items-center gap-2 rounded-full bg-rose-900 text-white hover:bg-rose-900/90"
              onClick={handleDownload}
              disabled={!reservationId || downloading}
            >
              <Download className="h-4 w-4 ms-2" />
              {downloading ? 'جاري التحميل...' : 'تحميل الفاتورة'}
            </Button>
          </div>

          <Card className="bg-white rounded-3xl border-zinc-200 shadow-sm border-t-8 border-t-rose-900">
            <CardContent className="p-8 md:p-12">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-8 mb-8">
                <div className="flex items-center gap-3 text-black">
                  <Hotel className="h-10 w-10 ms-3" />
                  <div>
                    <h2
                      className="text-3xl font-black tracking-tighter text-rose-900"
                      style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}
                    >
                      روميفاي
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                      فنادق ومنتجعات فاخرة
                    </p>
                  </div>
                </div>
                <div className="text-start">
                  <p className="text-sm text-zinc-500 text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    رقم التأكيد: {confirmationNumber}
                  </p>
                  <p className="text-sm text-zinc-500 text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    التاريخ: {formatDateAr(new Date().toISOString().slice(0, 10))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 bg-rose-50 p-6 rounded-3xl border border-rose-100">
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    فاتورة إلى
                  </h4>
                  <p className="font-black text-rose-950 text-xl mb-1" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    {reservation.guestName || '—'}
                  </p>
                  <p className="text-rose-900/70 text-sm font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    {reservation.guestEmail || '—'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    تفاصيل الإقامة
                  </h4>
                  <p className="text-rose-950 font-bold text-sm mb-1" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    <span className="text-rose-900/70 ms-2 font-normal">الغرفة:</span> {reservation.roomNumber || '—'}
                  </p>
                  <p className="text-rose-950 font-bold text-sm mb-1" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    <span className="text-rose-900/70 ms-2 font-normal">الدخول:</span> {formatDateAr(reservation.checkInDate)}
                  </p>
                  <p className="text-rose-950 font-bold text-sm" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                    <span className="text-rose-900/70 ms-2 font-normal">الخروج:</span> {formatDateAr(reservation.checkOutDate)}
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-3xl border border-rose-200 overflow-hidden">
                <table className="w-full text-end border-collapse">
                  <thead className="bg-rose-50 border-b border-rose-200">
                    <tr>
                      <th className="py-4 px-6 text-xs font-bold text-rose-800 uppercase tracking-wider w-3/4" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                        الوصف
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-rose-800 uppercase tracking-wider w-1/4 text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                        المبلغ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 bg-white">
                    {(bill?.lineItems ?? []).map((item, idx) => {
                      const amount = Number(item?.amount ?? 0)
                      const credit = !!item?.credit
                      return (
                        <tr key={idx} className="hover:bg-rose-50/50 transition-colors">
                          <td className="py-4 px-6 text-rose-950 font-medium text-sm text-start" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                            {item?.label ?? '—'}
                          </td>
                          <td className="py-4 px-6 text-rose-950 font-bold text-sm text-start font-mono">
                            {credit ? `-${formatAmount(amount)}` : formatAmount(amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3 bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <div className="border-t border-rose-200 pt-4 mt-4 flex justify-between items-center">
                    <span className="text-lg font-black text-rose-950" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                      الإجمالي الكلي
                    </span>
                    <span className="text-2xl font-black text-rose-950 font-mono">{formatAmount(bill.balanceDue)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
                <p className="text-zinc-400 text-sm font-medium" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
                  شكرًا لاختياركم فنادق ومنتجعات روميفاي. نتمنى رؤيتكم قريبًا.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default InvoicePreview
