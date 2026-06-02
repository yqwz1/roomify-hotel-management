package com.roomify.backend.service;

import com.roomify.backend.dto.MockPaymentRequest;
import com.roomify.backend.dto.MockRefundRequest;
import com.roomify.backend.dto.PaymentRequest;
import com.roomify.backend.dto.PaymentResponse;
import com.roomify.backend.entity.Payment;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.PaymentRepository;
import com.roomify.backend.repository.ReservationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final int MONEY_SCALE = 2;
    private static final int DEFAULT_LIST_LIMIT = 250;
    private static final int MAX_LIST_LIMIT = 500;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    private static final EnumSet<PaymentMethod> GUEST_ONLINE_METHODS = EnumSet.of(
            PaymentMethod.CREDIT_CARD_DEMO,
            PaymentMethod.MADA_DEMO,
            PaymentMethod.APPLE_PAY_DEMO,
            PaymentMethod.CARD,
            PaymentMethod.ONLINE);

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ReservationFinancialService financialService;
    private final ReservationStatusTransitionService reservationStatusTransitionService;

    public PaymentService(
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository,
            AuditService auditService,
            NotificationService notificationService,
            EmailService emailService,
            ReservationFinancialService financialService,
            ReservationStatusTransitionService reservationStatusTransitionService) {
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.financialService = financialService;
        this.reservationStatusTransitionService = reservationStatusTransitionService;
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
            reservation.setInvoiceStatus(newRemainingBalance.compareTo(BigDecimal.ZERO) == 0 ? "PAID" : "PENDING");
            reservation.setPaymentMethod(request.getPaymentMethod());
            reservation.setTransactionId(gatewayReference);
            reservation.setPaymentTimestamp(savedTimestampCandidate());
            if (newRemainingBalance.compareTo(BigDecimal.ZERO) == 0) {
                reservationStatusTransitionService.transition(
                        reservation,
                        reservationStatusTransitionService.resolvePostPaymentStatus(reservation),
                        new ReservationStatusTransitionService.ReservationActor("payments@roomify.local", "ROLE_STAFF"),
                        "Payment processed",
                        true);
            }

            payment.setPaymentStatus(PaymentStatus.PAID);
            payment.setGatewayReference(gatewayReference);
            payment.setPaidAt(LocalDateTime.now());

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
            notificationService.notifyPaymentCompleted(reservation, amount);

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

    public PaymentResponse checkoutGuestReservation(String confirmationNumber, MockPaymentRequest request, String guestEmail) {
        Reservation reservation = reservationRepository.findByConfirmationNumber(normalize(confirmationNumber))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        assertGuestOwnsReservation(reservation, guestEmail);

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new ResourceConflictException("This reservation is cancelled and cannot be paid");
        }

        if (!GUEST_ONLINE_METHODS.contains(request.getPaymentMethod())) {
            throw new ResourceConflictException(
                    "Guest self-bookings must use the card payment form before confirmation");
        }

        if (financialService.syncReservation(reservation)) {
            reservationRepository.save(reservation);
        }

        BigDecimal amount = sanitize(reservation.getOutstandingBalance());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            amount = sanitize(reservation.getTotalPrice());
        }

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setAmount(amount);
        payment.setPaymentMethod(normalizeGuestMethod(request.getPaymentMethod()));
        payment.setPaymentStatus(PaymentStatus.PROCESSING);
        payment.setCurrency("SAR");
        payment.setLastFourDigits(lastFourDigits(request.getCardNumber()));
        payment.setGatewayReference(generateMockTransactionId());

        MockCardResult result = evaluateDemoCard(request.getCardNumber());
        if (!result.success()) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setFailureReason(result.failureReason());
            reservation.setPaymentStatus(PaymentStatus.FAILED);
            reservation.setInvoiceStatus("CANCELLED");
            reservation.setInvoiceFinalized(false);
            reservation.setCancellationReason("Payment failed: " + result.failureReason());
            reservation.setCancellationAt(LocalDateTime.now());
            reservationStatusTransitionService.transition(
                    reservation,
                    ReservationStatus.CANCELLED,
                    new ReservationStatusTransitionService.ReservationActor(guestEmail, "ROLE_GUEST"),
                    "Payment failed: " + result.failureReason(),
                    true);
            Payment saved = paymentRepository.save(payment);
            reservationRepository.save(reservation);
            auditService.log("MOCK_PAYMENT_FAILED", reservation.getConfirmationNumber(),
                    "paymentId=" + saved.getId() + " reason=" + result.failureReason());
            notificationService.notifyPaymentFailed(reservation.getConfirmationNumber(), result.failureReason());
            return toResponse(saved, "Demo payment failed: " + result.failureReason());
        }

        LocalDateTime now = LocalDateTime.now();
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setPaidAt(now);
        reservation.setTotalPaid(amount);
        reservation.setOutstandingBalance(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING));
        reservation.setPaymentStatus(PaymentStatus.PAID);
        reservation.setInvoiceFinalized(true);
        reservation.setInvoiceStatus("PAID");
        reservation.setPaymentMethod(payment.getPaymentMethod());
        reservation.setTransactionId(payment.getGatewayReference());
        reservation.setPaymentTimestamp(now);
        reservationStatusTransitionService.transition(
                reservation,
                reservationStatusTransitionService.resolvePostPaymentStatus(reservation),
                new ReservationStatusTransitionService.ReservationActor(guestEmail, "ROLE_GUEST"),
                "Demo payment completed",
                true);

        Payment saved = paymentRepository.save(payment);
        reservationRepository.save(reservation);
        auditService.log("MOCK_PAYMENT_SUCCESS", reservation.getConfirmationNumber(),
                "paymentId=" + saved.getId() + " transactionId=" + saved.getGatewayReference());
        notificationService.notifyPaymentCompleted(reservation, amount);
        sendReceiptEmailGracefully(saved, reservation);
        return toResponse(saved, "Demo payment processed successfully");
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long paymentId, String requesterEmail, boolean privileged) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        if (!privileged) {
            assertGuestOwnsReservation(payment.getReservation(), requesterEmail);
        }
        return toResponse(payment, "Payment loaded");
    }

    @Transactional(readOnly = true)
    public PaymentResponse getLatestForReservation(Long reservationId, String requesterEmail, boolean privileged) {
        Payment payment = paymentRepository.findTopByReservation_IdOrderByCreatedAtDesc(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for reservation: " + reservationId));
        if (!privileged) {
            assertGuestOwnsReservation(payment.getReservation(), requesterEmail);
        }
        return toResponse(payment, "Payment loaded");
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(PaymentStatus status, String requesterEmail, boolean privileged) {
        return listPayments(status, requesterEmail, privileged, null);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(PaymentStatus status, String requesterEmail, boolean privileged, Integer limit) {
        Pageable page = PageRequest.of(0, normalizeListLimit(limit));
        List<Payment> payments = privileged
                ? (status == null
                        ? paymentRepository.findAllByOrderByCreatedAtDesc(page)
                        : paymentRepository.findByPaymentStatusOrderByCreatedAtDesc(status, page))
                : paymentRepository.findByReservation_Guest_EmailIgnoreCaseOrderByCreatedAtDesc(requesterEmail, page);
        return payments.stream()
                .map(payment -> toResponse(payment, "Payment loaded"))
                .toList();
    }

    public PaymentResponse refundPayment(Long paymentId, MockRefundRequest request, String actorEmail) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getPaymentStatus() != PaymentStatus.PAID) {
            throw new ResourceConflictException("Only PAID demo payments can be refunded");
        }

        Reservation reservation = payment.getReservation();
        LocalDateTime now = LocalDateTime.now();
        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        payment.setRefundedAt(now);
        payment.setRefundReason(normalizeOptional(request != null ? request.getReason() : null));
        payment.setRefundedBy(actorEmail);

        reservation.setPaymentStatus(PaymentStatus.REFUNDED);
        reservation.setInvoiceStatus("REFUNDED");
        reservation.setTotalPaid(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING));
        reservation.setOutstandingBalance(sanitize(reservation.getTotalPrice()));
        reservation.setPaymentTimestamp(now);

        Payment saved = paymentRepository.save(payment);
        reservationRepository.save(reservation);
        auditService.log("MOCK_PAYMENT_REFUNDED", reservation.getConfirmationNumber(),
                "paymentId=" + saved.getId() + " refundedBy=" + actorEmail);
        return toResponse(saved, "Payment refunded successfully.");
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
        return generateMockTransactionId();
    }

    private PaymentMethod normalizeGuestMethod(PaymentMethod method) {
        if (method == PaymentMethod.CARD || method == PaymentMethod.ONLINE) {
            return PaymentMethod.CREDIT_CARD_DEMO;
        }
        return method;
    }

    private MockCardResult evaluateDemoCard(String cardNumber) {
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("\\D", "");
        return switch (digits) {
            case "4242424242424242" -> new MockCardResult(true, null);
            case "4000000000000002" -> new MockCardResult(false, "CARD_DECLINED");
            case "4000000000009995" -> new MockCardResult(false, "INSUFFICIENT_FUNDS");
            case "4000000000000069" -> new MockCardResult(false, "EXPIRED_CARD");
            default -> new MockCardResult(false,
                    "UNSUPPORTED_DEMO_CARD. Use 4242 4242 4242 4242 for a successful demo payment.");
        };
    }

    private String lastFourDigits(String cardNumber) {
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("\\D", "");
        if (digits.length() < 4) {
            return null;
        }
        return digits.substring(digits.length() - 4);
    }

    private String generateMockTransactionId() {
        int sequence = ThreadLocalRandom.current().nextInt(1, 1_000_000);
        return "MOCK-TXN-" + Year.now().getValue() + "-" + String.format("%06d", sequence);
    }

    private void assertGuestOwnsReservation(Reservation reservation, String guestEmail) {
        String expectedEmail = reservation.getGuest() != null ? reservation.getGuest().getEmail() : null;
        if (guestEmail == null || expectedEmail == null || !expectedEmail.equalsIgnoreCase(guestEmail.trim())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Reservation access denied for authenticated guest");
        }
    }

    private PaymentResponse toResponse(Payment payment, String message) {
        Reservation reservation = payment.getReservation();
        PaymentResponse response = new PaymentResponse(
                payment.getId(),
                reservation.getConfirmationNumber(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                reservation.getTotalPaid(),
                reservation.getOutstandingBalance(),
                reservation.isInvoiceFinalized(),
                payment.getGatewayReference(),
                message,
                payment.getCreatedAt());
        response.setReservationId(reservation.getId());
        response.setInvoiceNumber(reservation.getInvoiceNumber());
        response.setInvoiceStatus(reservation.getInvoiceStatus());
        response.setCurrency(payment.getCurrency());
        response.setFailureReason(payment.getFailureReason());
        response.setLastFourDigits(payment.getLastFourDigits());
        response.setPaidAt(payment.getPaidAt());
        response.setRefundedAt(payment.getRefundedAt());
        response.setRefundReason(payment.getRefundReason());
        response.setRefundedBy(payment.getRefundedBy());
        if (reservation.getGuest() != null) {
            response.setGuestName(reservation.getGuest().getName());
            response.setGuestEmail(reservation.getGuest().getEmail());
        }
        if (reservation.getRoom() != null) {
            response.setRoomNumber(reservation.getRoom().getRoomNumber());
            if (reservation.getRoom().getRoomType() != null) {
                response.setRoomType(reservation.getRoom().getRoomType().getName());
            }
        }
        return response;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record MockCardResult(boolean success, String failureReason) {
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

    private int normalizeListLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIST_LIMIT;
        }
        return Math.min(limit, MAX_LIST_LIMIT);
    }

    private java.time.LocalDateTime savedTimestampCandidate() {
        return java.time.LocalDateTime.now();
    }
}
