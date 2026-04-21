import api from './api'

export const getInvoiceHistory = async () => {
  const response = await api.get('/invoices')
  return response.data
}

export const getInvoiceDetails = async (reservationId) => {
  const response = await api.get(`/invoices/${reservationId}`)
  return response.data
}

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

export const sendInvoiceEmail = async (reservationId) => {
  const response = await api.post(`/invoices/${reservationId}/email`)
  return response.data
}

export const getGuestInvoiceHistory = async () => {
  const response = await api.get('/guest/invoices')
  return response.data
}

export const getGuestInvoiceDetails = async (confirmationNumber) => {
  const response = await api.get(`/guest/invoices/${confirmationNumber}`)
  return response.data
}

export const getGuestInvoicePdf = async (confirmationNumber) => {
  const response = await api.get(`/guest/invoices/${confirmationNumber}/pdf`, {
    responseType: 'blob',
  })
  return response.data
}
