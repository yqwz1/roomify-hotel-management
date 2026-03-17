import api from './api'

export const generateInvoice = async (reservationId) => {
  const response = await api.post(`/invoices/${reservationId}`)
  return response.data
}

export const getInvoicePdf = async (reservationId) => {
  const response = await api.get(`/invoices/pdf/${reservationId}`, {
    responseType: 'blob',
  })
  return response.data
}

export const getInvoiceDeliveryStatus = async (reservationId) => {
  const response = await api.get(`/invoices/${reservationId}/delivery-status`)
  return response.data
}

