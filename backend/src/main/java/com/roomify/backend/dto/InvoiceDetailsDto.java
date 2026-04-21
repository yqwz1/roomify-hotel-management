package com.roomify.backend.dto;

import java.time.LocalDateTime;

public class InvoiceDetailsDto {

    private InvoiceListItemDto invoice;
    private BillResponse bill;
    private String deliveryStatus;
    private String deliveryErrorMessage;
    private LocalDateTime deliverySentAt;
    private boolean pdfAvailable;

    public InvoiceDetailsDto() {
    }

    public InvoiceDetailsDto(
            InvoiceListItemDto invoice,
            BillResponse bill,
            String deliveryStatus,
            String deliveryErrorMessage,
            LocalDateTime deliverySentAt,
            boolean pdfAvailable) {
        this.invoice = invoice;
        this.bill = bill;
        this.deliveryStatus = deliveryStatus;
        this.deliveryErrorMessage = deliveryErrorMessage;
        this.deliverySentAt = deliverySentAt;
        this.pdfAvailable = pdfAvailable;
    }

    public InvoiceListItemDto getInvoice() {
        return invoice;
    }

    public void setInvoice(InvoiceListItemDto invoice) {
        this.invoice = invoice;
    }

    public BillResponse getBill() {
        return bill;
    }

    public void setBill(BillResponse bill) {
        this.bill = bill;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(String deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public String getDeliveryErrorMessage() {
        return deliveryErrorMessage;
    }

    public void setDeliveryErrorMessage(String deliveryErrorMessage) {
        this.deliveryErrorMessage = deliveryErrorMessage;
    }

    public LocalDateTime getDeliverySentAt() {
        return deliverySentAt;
    }

    public void setDeliverySentAt(LocalDateTime deliverySentAt) {
        this.deliverySentAt = deliverySentAt;
    }

    public boolean isPdfAvailable() {
        return pdfAvailable;
    }

    public void setPdfAvailable(boolean pdfAvailable) {
        this.pdfAvailable = pdfAvailable;
    }
}
