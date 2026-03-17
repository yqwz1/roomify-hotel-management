import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FilePlus2, Hotel, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import ConfirmationToast from '../components/ConfirmationToast'
import { generateInvoice, getInvoiceDeliveryStatus, getInvoicePdf } from '../services/invoiceService'
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

  const [deliveryStatus, setDeliveryStatus] = useState('IDLE')
  const [deliveryMeta, setDeliveryMeta] = useState({ errorMessage: null, sentAt: null })

  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const reservationId = reservation?.id
  const confirmationNumber = reservation?.confirmationNumber
  const invoiceFinalized = !!bill?.invoiceFinalized

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
      const reservationData = await getReservationByConfirmationNumber(trimmed)
      setReservation(reservationData)

      const billData = await getBill(reservationData.confirmationNumber)
      setBill(billData)

      if (!billData?.invoiceFinalized) {
        setDeliveryStatus('IDLE')
        setDeliveryMeta({ errorMessage: null, sentAt: null })
        return
      }

      try {
        const delivery = await getInvoiceDeliveryStatus(reservationData.id)
        setDeliveryStatus(delivery?.status || 'UNKNOWN')
        setDeliveryMeta({
          errorMessage: delivery?.errorMessage ?? null,
          sentAt: delivery?.sentAt ?? null,
        })
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

  const handleGenerate = useCallback(async () => {
    if (!reservationId || generating || invoiceFinalized) return

    try {
      setGenerating(true)
      await generateInvoice(reservationId)
      setToast({ message: 'تم إنشاء الفاتورة وإرسالها بنجاح.', type: 'success' })
      await fetchEverything(confirmationNumber)
    } catch (err) {
      setToast({ message: extractReservationError(err), type: 'error' })
    } finally {
      setGenerating(false)
    }
  }, [reservationId, generating, invoiceFinalized, fetchEverything, confirmationNumber])

  const handleDownload = useCallback(async () => {
    if (!reservationId || !invoiceFinalized || downloading) return

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
    } catch {
      setToast({ message: 'تعذر تحميل الفاتورة. حاول مرة أخرى.', type: 'error' })
    } finally {
      setDownloading(false)
    }
  }, [reservationId, invoiceFinalized, downloading])

  const handlePrint = useCallback(async () => {
    if (!reservationId || !invoiceFinalized) return

    try {
      const blob = await getInvoicePdf(reservationId)
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url)
      if (printWindow) printWindow.focus()
    } catch {
      setToast({ message: 'تعذر فتح الفاتورة للطباعة. حاول مرة أخرى.', type: 'error' })
    }
  }, [reservationId, invoiceFinalized])

  const deliveryBadge = useMemo(() => {
    if (!reservationId) {
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-600">
          ابحث عن حجز لعرض الفاتورة
        </span>
      )
    }

    if (!invoiceFinalized) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-900">
          لم يتم إنشاء الفاتورة بعد
        </span>
      )
    }

    if (deliveryStatus === 'LOADING') {
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-600">
          جاري تحميل حالة إرسال الفاتورة...
        </span>
      )
    }

    if (deliveryStatus === 'ERROR') {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-4 py-1.5 text-xs font-medium text-rose-900">
          تعذر جلب حالة إرسال البريد الإلكتروني.
        </span>
      )
    }

    if (deliveryStatus === 'SENT') {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-900/10 px-4 py-1.5 text-xs font-medium text-rose-900">
          تم إرسال الفاتورة إلى البريد الإلكتروني
        </span>
      )
    }

    if (deliveryStatus === 'FAILED') {
      return (
        <span className="inline-flex flex-col gap-1 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-medium text-rose-900 sm:flex-row sm:items-center">
          <span>فشل إرسال الفاتورة إلى البريد الإلكتروني</span>
          {deliveryMeta.errorMessage && (
            <span className="text-[11px] text-rose-800">({deliveryMeta.errorMessage})</span>
          )}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-600">
        لم يتم إرسال الفاتورة بعد
      </span>
    )
  }, [reservationId, invoiceFinalized, deliveryStatus, deliveryMeta.errorMessage])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" dir="rtl">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <Card className="rounded-3xl border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span
              className="me-2 text-2xl font-bold text-rose-900"
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
              <Search className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setError(null)
                }}
                placeholder="رقم التأكيد (مثلاً RSV-...)"
                className="rounded-full border-zinc-300 pe-10 focus-visible:ring-rose-900"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-full bg-rose-900 px-8 text-white hover:bg-rose-900/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </Button>
          </form>

          {error && (
            <div className="mt-4">
              <ErrorState
                title="تعذر تحميل الفاتورة"
                message={error}
                onRetry={() => fetchEverything(query)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {loading && <LoadingState message="جاري تحميل بيانات الفاتورة..." />}

      {!loading && reservation && bill && (
        <>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            {!invoiceFinalized ? (
              <Button
                className="flex items-center gap-2 rounded-full bg-rose-900 text-white hover:bg-rose-900/90"
                onClick={handleGenerate}
                disabled={!reservationId || generating}
              >
                <FilePlus2 className="ms-2 h-4 w-4" />
                {generating ? 'جارٍ إنشاء الفاتورة...' : 'إنشاء الفاتورة'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-full border-rose-900/10 text-rose-900 hover:bg-rose-900 hover:text-white"
                  onClick={handlePrint}
                  disabled={!reservationId || !invoiceFinalized}
                >
                  طباعة
                </Button>
                <Button
                  className="flex items-center gap-2 rounded-full bg-rose-900 text-white hover:bg-rose-900/90"
                  onClick={handleDownload}
                  disabled={!reservationId || !invoiceFinalized || downloading}
                >
                  <Download className="ms-2 h-4 w-4" />
                  {downloading ? 'جارٍ التحميل...' : 'تحميل الفاتورة'}
                </Button>
              </>
            )}
          </div>

          {!invoiceFinalized && (
            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-5 text-sm text-amber-900">
                أنشئ الفاتورة أولاً ليتم إرسالها بالبريد الإلكتروني وتفعيل الطباعة والتنزيل.
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl border-zinc-200 border-t-8 border-t-rose-900 bg-white shadow-sm">
            <CardContent className="p-8 md:p-12">
              <div className="mb-8 flex items-start justify-between border-b border-zinc-100 pb-8">
                <div className="flex items-center gap-3 text-black">
                  <Hotel className="ms-3 h-10 w-10" />
                  <div>
                    <h2
                      className="text-3xl font-black tracking-tighter text-rose-900"
                      style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}
                    >
                      روميفاي
                    </h2>
                    <p
                      className="text-sm font-medium text-zinc-500"
                      style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                    >
                      فنادق ومنتجعات فاخرة
                    </p>
                  </div>
                </div>
                <div className="text-start">
                  <p
                    className="text-start text-sm text-zinc-500"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    رقم التأكيد: {confirmationNumber}
                  </p>
                  <p
                    className="text-start text-sm text-zinc-500"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    التاريخ: {formatDateAr(new Date().toISOString().slice(0, 10))}
                  </p>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-8 rounded-3xl border border-rose-100 bg-rose-50 p-6">
                <div>
                  <h4
                    className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-800"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    فاتورة إلى
                  </h4>
                  <p
                    className="mb-1 text-xl font-black text-rose-950"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    {reservation.guestName || '—'}
                  </p>
                  <p
                    className="text-sm font-medium text-rose-900/70"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    {reservation.guestEmail || '—'}
                  </p>
                </div>
                <div>
                  <h4
                    className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-800"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    تفاصيل الإقامة
                  </h4>
                  <p
                    className="mb-1 text-sm font-bold text-rose-950"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    <span className="ms-2 font-normal text-rose-900/70">الغرفة:</span> {reservation.roomNumber || '—'}
                  </p>
                  <p
                    className="mb-1 text-sm font-bold text-rose-950"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    <span className="ms-2 font-normal text-rose-900/70">الدخول:</span> {formatDateAr(reservation.checkInDate)}
                  </p>
                  <p
                    className="text-sm font-bold text-rose-950"
                    style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                  >
                    <span className="ms-2 font-normal text-rose-900/70">الخروج:</span> {formatDateAr(reservation.checkOutDate)}
                  </p>
                </div>
              </div>

              <div className="mb-8 overflow-hidden rounded-3xl border border-rose-200">
                <table className="w-full border-collapse text-end">
                  <thead className="border-b border-rose-200 bg-rose-50">
                    <tr>
                      <th
                        className="w-3/4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-rose-800"
                        style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                      >
                        الوصف
                      </th>
                      <th
                        className="w-1/4 px-6 py-4 text-start text-xs font-bold uppercase tracking-wider text-rose-800"
                        style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                      >
                        المبلغ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 bg-white">
                    {(bill?.lineItems ?? []).map((item, idx) => {
                      const amount = Number(item?.amount ?? 0)
                      const credit = !!item?.credit
                      return (
                        <tr key={idx} className="transition-colors hover:bg-rose-50/50">
                          <td
                            className="px-6 py-4 text-start text-sm font-medium text-rose-950"
                            style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                          >
                            {item?.label ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-start text-sm font-bold text-rose-950">
                            {credit ? `-${formatAmount(amount)}` : formatAmount(amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3 rounded-3xl border border-rose-100 bg-rose-50 p-6">
                  <div className="mt-4 flex items-center justify-between border-t border-rose-200 pt-4">
                    <span
                      className="text-lg font-black text-rose-950"
                      style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                    >
                      الإجمالي الكلي
                    </span>
                    <span className="font-mono text-2xl font-black text-rose-950">
                      {formatAmount(bill.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-16 border-t border-zinc-200 pt-8 text-center">
                <p
                  className="text-sm font-medium text-zinc-400"
                  style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
                >
                  شكراً لاختياركم فنادق ومنتجعات روميفاي. نتمنى رؤيتكم قريباً.
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
