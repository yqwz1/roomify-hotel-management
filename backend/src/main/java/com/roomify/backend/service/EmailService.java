package com.roomify.backend.service;

import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ServiceRequest;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final com.roomify.backend.notification.NotificationEmailService delegate;

    public EmailService(com.roomify.backend.notification.NotificationEmailService delegate) {
        this.delegate = delegate;
    }

    public void sendInvoiceEmail(String recipient, byte[] pdf, String invoiceNumber) {
        delegate.sendInvoiceEmail(recipient, pdf, invoiceNumber);
    }

    public void sendReceiptEmail(
            String to,
            String guestName,
            String confirmationNumber,
            String receiptNumber,
            String invoiceNumber,
            String paymentMethod,
            String paymentDate,
            String amount) {
        delegate.sendReceiptEmail(
                to,
                guestName,
                confirmationNumber,
                receiptNumber,
                invoiceNumber,
                paymentMethod,
                paymentDate,
                amount,
                localeTag());
    }

    public void sendStaffWelcomeEmail(String to, String name, String password) {
        delegate.sendStaffWelcomeEmail(to, name, password, localeTag());
    }

    public void sendGuestWelcomeEmail(String to, String name) {
        delegate.sendGuestWelcomeEmail(to, name, localeTag());
    }

    public void sendReservationConfirmationEmail(String to, String guestName, ReservationResponse reservation) {
        delegate.sendReservationConfirmationEmail(to, guestName, reservation, localeTag());
    }

    public void sendReservationCancellationEmail(
            String to,
            String guest,
            String room,
            String checkin,
            String checkout,
            String total,
            String confirmation) {
        delegate.sendReservationCancellationEmail(
                to,
                guest,
                room,
                checkin,
                checkout,
                total,
                confirmation,
                localeTag());
    }

    public void sendReservationModificationEmail(
            String to,
            String oldRoom,
            String newRoom,
            String oldCheckin,
            String newCheckin,
            String oldCheckout,
            String newCheckout,
            String newTotal,
            String confirmation) {
        delegate.sendReservationModificationEmail(
                to,
                oldRoom,
                newRoom,
                oldCheckin,
                newCheckin,
                oldCheckout,
                newCheckout,
                newTotal,
                confirmation,
                localeTag());
    }

    public void sendCheckInReminderEmail(Reservation reservation, String localeTag) {
        delegate.sendCheckInReminderEmail(reservation, localeTag);
    }

    public void sendPaymentReminderEmail(Reservation reservation, String localeTag) {
        delegate.sendPaymentReminderEmail(reservation, localeTag);
    }

    public void sendRoomReadyEmail(Reservation reservation, String localeTag) {
        delegate.sendRoomReadyEmail(reservation, localeTag);
    }

    public void sendServiceRequestCompletedEmail(ServiceRequest serviceRequest, String localeTag) {
        delegate.sendServiceRequestCompletedEmail(serviceRequest, localeTag);
    }

    public void sendPasswordResetEmail(String recipient, String displayName, String rawToken, String localeTag) {
        delegate.sendPasswordResetEmail(recipient, displayName, rawToken, localeTag);
    }

    private String localeTag() {
        return LocaleContextHolder.getLocale().toLanguageTag();
    }
}
