package com.roomify.backend.service;

import com.roomify.backend.dto.PaymentRequest;
import com.roomify.backend.dto.PaymentResponse;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ReservationFinancialService financialService;

    public PaymentService(
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository,
            AuditService auditService,
            NotificationService notificationService,
            EmailService emailService,
            ReservationFinancialService financialService) {
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.financialService = financialService;
    }

    public PaymentResponse createPayment(PaymentRequest request) {
        String confirmationNumber = normalize(request.getConfirmationNumber());

        Reservation reservation = reservationRepository.findByConfirmationNumber(confirmationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        if (financialService.syncReservation(reservation)) {
            reservationRepository.save(reservation);
        }

        BigDecimal amount = sanitize(request.getAmount());

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            logFailedAttempt(confirmationNumber, request.getPaymentMethod(), amount, "Invalid payment amount");
            notificationService.notifyPaymentFailed(confirmationNumber, "Invalid payment amount");
            throw new ResourceConflictException("Payment amount must be greater than 0");
        }

        BigDecimal totalPrice = sanitize(reservation.getTotalPrice());
        BigDecimal totalPaid = sanitize(reservation.getTotalPaid());
        BigDecimal remainingBalance = calculateOutstanding(totalPrice, totalPaid);

        if (remainingBalance.compareTo(BigDecimal.ZERO) == 0
                || totalPaid.compareTo(totalPrice) >= 0) {
            logFailedAttempt(confirmationNumber, request.getPaymentMethod(), amount, "Bill already fully paid");
            notificationService.notifyPaymentFailed(confirmationNumber, "Bill already fully paid");
            throw new ResourceConflictException("This bill is already fully paid and cannot receive new payments");
        }

        if (amount.compareTo(remainingBalance) > 0) {
            logFailedAttempt(confirmationNumber, request.getPaymentMethod(), amount, "Overpayment blocked");
            notificationService.notifyPaymentFailed(
                    confirmationNumber,
                    "Overpayment blocked. Remaining balance is " + remainingBalance);
            throw new ResourceConflictException(
                    "Payment exceeds remaining balance. Remaining balance is " + remainingBalance);
        }

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setAmount(amount);
        payment.setPaymentMethod(request.getPaymentMethod());

        String gatewayReference = null;

        try {
            switch (request.getPaymentMethod()) {
                case CASH -> handleCashPayment(payment);
                case CARD -> handleCardPayment(payment);
                case ONLINE -> gatewayReference = handleOnlinePayment(payment);
            }

            BigDecimal newTotalPaid = totalPaid.add(amount).setScale(MONEY_SCALE, ROUNDING);
            BigDecimal newRemainingBalance = calculateOutstanding(totalPrice, newTotalPaid);

            PaymentStatus reservationPaymentStatus = newRemainingBalance.compareTo(BigDecimal.ZERO) == 0
                    ? PaymentStatus.PAID
                    : PaymentStatus.PARTIALLY_PAID;

            reservation.setTotalPaid(newTotalPaid);
            reservation.setOutstandingBalance(newRemainingBalance);
            reservation.setPaymentStatus(reservationPaymentStatus);
            reservation.setInvoiceFinalized(newRemainingBalance.compareTo(BigDecimal.ZERO) == 0);

            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setGatewayReference(gatewayReference);

            Payment savedPayment = paymentRepository.save(payment);
            reservationRepository.save(reservation);

            String metadata = String.format(
                    "amount=%s method=%s totalPaid=%s remainingBalance=%s paymentStatus=%s",
                    amount,
                    request.getPaymentMethod(),
                    newTotalPaid,
                    newRemainingBalance,
                    reservationPaymentStatus);

            auditService.log("PAYMENT_SUCCESS", confirmationNumber, metadata);
            if (reservationPaymentStatus == PaymentStatus.PARTIALLY_PAID) {
                notificationService.notifyIncompletePayment(
                        confirmationNumber,
                        amount,
                        newRemainingBalance);
            }

            log.info(
                    "Payment success for {} | method={} amount={} totalPaid={} remainingBalance={}",
                    confirmationNumber,
                    request.getPaymentMethod(),
                    amount,
                    newTotalPaid,
                    newRemainingBalance);

            sendReceiptEmailGracefully(savedPayment, reservation);

            return new PaymentResponse(
                    savedPayment.getId(),
                    confirmationNumber,
                    savedPayment.getAmount(),
                    savedPayment.getPaymentMethod(),
                    reservation.getPaymentStatus(),
                    reservation.getTotalPaid(),
                    reservation.getOutstandingBalance(),
                    reservation.isInvoiceFinalized(),
                    savedPayment.getGatewayReference(),
                    "Payment processed successfully",
                    savedPayment.getCreatedAt());

        } catch (RuntimeException ex) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setFailureReason(ex.getMessage());
            paymentRepository.save(payment);

            auditService.log(
                    "PAYMENT_FAILED",
                    confirmationNumber,
                    "method=" + request.getPaymentMethod() + " amount=" + amount + " reason=" + ex.getMessage());
            notificationService.notifyPaymentFailed(confirmationNumber, ex.getMessage());

            log.warn(
                    "Payment failed for {} | method={} amount={} reason={}",
                    confirmationNumber,
                    request.getPaymentMethod(),
                    amount,
                    ex.getMessage());

            throw ex;
        }
    }

    private void sendReceiptEmailGracefully(Payment payment, Reservation reservation) {

        String receiptNumber = "RCT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String invoiceNumber = reservation.getInvoiceNumber() != null && !reservation.getInvoiceNumber().isBlank()
                ? reservation.getInvoiceNumber()
                : "INV-" + reservation.getConfirmationNumber();

        String paymentDate = payment.getCreatedAt().toString();

        try {

            emailService.sendReceiptEmail(
                    reservation.getGuest().getEmail(),
                    reservation.getGuest().getName(),
                    reservation.getConfirmationNumber(),
                    receiptNumber,
                    invoiceNumber,
                    payment.getPaymentMethod().name(),
                    paymentDate,
                    payment.getAmount().setScale(MONEY_SCALE, ROUNDING).toPlainString());

            auditService.log(
                    "RECEIPT_EMAIL_SENT",
                    reservation.getConfirmationNumber(),
                    "receiptNumber=" + receiptNumber + " invoiceNumber=" + invoiceNumber);

        } catch (Exception ex) {

            auditService.log(
                    "RECEIPT_EMAIL_FAILED",
                    reservation.getConfirmationNumber(),
                    "receiptNumber=" + receiptNumber + " invoiceNumber=" + invoiceNumber + " reason=" + ex.getMessage());

            log.warn("Receipt email failed but payment is successful: {}", ex.getMessage());
        }
    }

    private void handleCashPayment(Payment payment) {
        payment.setPaymentStatus(PaymentStatus.PAID);
    }

    private void handleCardPayment(Payment payment) {
        payment.setPaymentStatus(PaymentStatus.PAID);
    }

    private String handleOnlinePayment(Payment payment) {
        payment.setPaymentStatus(PaymentStatus.PAID);
        return "ONLINE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void logFailedAttempt(String confirmationNumber, PaymentMethod method, BigDecimal amount, String reason) {
        auditService.log(
                "PAYMENT_FAILED",
                confirmationNumber,
                "method=" + method + " amount=" + amount + " reason=" + reason);
        log.warn(
                "Payment blocked for {} | method={} amount={} reason={}",
                confirmationNumber,
                method,
                amount,
                reason);
    }

    private BigDecimal sanitize(BigDecimal value) {
        return financialService.sanitize(value);
    }

    private String normalize(String confirmationNumber) {
        if (confirmationNumber == null || confirmationNumber.isBlank()) {
            throw new IllegalArgumentException("Confirmation number is required");
        }
        return confirmationNumber.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal calculateOutstanding(BigDecimal totalPrice, BigDecimal totalPaid) {
        return financialService.calculateOutstanding(totalPrice, totalPaid);
    }
}
