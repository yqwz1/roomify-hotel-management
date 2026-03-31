package com.roomify.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.dto.BillLineItem;
import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.PaymentValidationException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;

@Service
@Transactional
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final ReservationRepository reservationRepository;
    private final AuditService auditService;
    private final BigDecimal vatRate;

    public BillingService(
            ReservationRepository reservationRepository,
            AuditService auditService,
            @Value("${roomify.billing.vat-rate:0.15}") BigDecimal vatRate) {
        this.reservationRepository = reservationRepository;
        this.auditService = auditService;
        this.vatRate = vatRate;
    }

    public BillResponse calculateBill(
            String confirmationNumber,
            BigDecimal serviceCharges,
            BigDecimal discountAmount) {

        String normalized = normaliseConfirmationNumber(confirmationNumber);
        Reservation reservation = reservationRepository.findByConfirmationNumber(normalized)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        return buildBillResponse(reservation, normalized, serviceCharges, discountAmount, true);
    }

    public BillResponse recordPayment(String confirmationNumber, BigDecimal amount) {
        String normalized = normaliseConfirmationNumber(confirmationNumber);
        Reservation reservation = reservationRepository.findByConfirmationNumber(normalized)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }

        BigDecimal paymentAmount = amount.setScale(MONEY_SCALE, ROUNDING);
        BigDecimal totalPrice = sanitise(reservation.getTotalPrice());
        BigDecimal totalPaid = sanitise(reservation.getTotalPaid());
        BigDecimal currentOutstanding = calculateOutstanding(totalPrice, totalPaid);
        BigDecimal projectedPaid = totalPaid.add(paymentAmount).setScale(MONEY_SCALE, ROUNDING);

        // Overpayment is blocked by design: paid amount can never exceed total price.
        if (projectedPaid.compareTo(totalPrice) > 0) {
            throw new PaymentValidationException(
                    "PAYMENT_OVERPAYMENT_BLOCKED",
                    "Overpayment is not allowed. Remaining balance is " + currentOutstanding,
                    reservation.getPaymentStatus() != null
                            ? reservation.getPaymentStatus().name()
                            : "UNPAID",
                    currentOutstanding,
                    reservation.isInvoiceFinalized());
        }

        BigDecimal projectedOutstanding = calculateOutstanding(totalPrice, projectedPaid);
        // Bill auto-closes when full payment is reached.
        boolean isFullyPaid = projectedOutstanding.compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)) == 0;

        reservation.setTotalPaid(projectedPaid);
        reservation.setOutstandingBalance(projectedOutstanding);
        reservation.setPaymentStatus(isFullyPaid
                ? com.roomify.backend.entity.PaymentStatus.PAID
                : com.roomify.backend.entity.PaymentStatus.PARTIALLY_PAID);
        reservation.setInvoiceFinalized(isFullyPaid);
        reservationRepository.save(reservation);

        String metadata = String.format(
                "paid=%s totalPaid=%s outstanding=%s finalized=%s paymentStatus=%s",
                paymentAmount,
                projectedPaid,
                projectedOutstanding,
                isFullyPaid,
                reservation.getPaymentStatus());

        auditService.log("PAYMENT_RECORDED", normalized, metadata);

        log.info(
                "Payment recorded for {} | amount={} totalPaid={} outstanding={} finalized={} paymentStatus={}",
                normalized, paymentAmount, projectedPaid, projectedOutstanding, isFullyPaid,
                reservation.getPaymentStatus());

        return buildBillResponse(reservation, normalized, BigDecimal.ZERO, BigDecimal.ZERO, false);
    }

    public BillResponse closeBill(String confirmationNumber) {
        String normalized = normaliseConfirmationNumber(confirmationNumber);
        Reservation reservation = reservationRepository.findByConfirmationNumber(normalized)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        BigDecimal totalPrice = sanitise(reservation.getTotalPrice());
        BigDecimal totalPaid = sanitise(reservation.getTotalPaid());
        BigDecimal outstanding = calculateOutstanding(totalPrice, totalPaid);

        // Manual close is allowed only when no remaining balance exists.
        if (outstanding.compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)) > 0) {
            throw new PaymentValidationException(
                    "PAYMENT_BALANCE_DUE",
                    "Outstanding balance must be 0.00 before bill close. Current outstanding: " + outstanding,
                    reservation.getPaymentStatus() != null
                            ? reservation.getPaymentStatus().name()
                            : "UNPAID",
                    outstanding,
                    reservation.isInvoiceFinalized());
        }

        reservation.setTotalPaid(totalPaid);
        reservation.setOutstandingBalance(outstanding);
        reservation.setPaymentStatus(com.roomify.backend.entity.PaymentStatus.PAID);
        reservation.setInvoiceFinalized(true);
        reservationRepository.save(reservation);

        auditService.log("BILL_CLOSED", normalized, "finalized=true paymentStatus=" + reservation.getPaymentStatus());
        log.info("Bill closed for {} | totalPaid={} outstanding={} paymentStatus={}",
                normalized, totalPaid, outstanding, reservation.getPaymentStatus());

        return buildBillResponse(reservation, normalized, BigDecimal.ZERO, BigDecimal.ZERO, false);
    }

    private BillResponse buildBillResponse(
            Reservation reservation,
            String normalizedConfirmation,
            BigDecimal serviceCharges,
            BigDecimal discountAmount,
            boolean auditBillCalculated) {

        BigDecimal safeServiceCharges = sanitise(serviceCharges);
        BigDecimal safeDiscount = sanitise(discountAmount);

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(), reservation.getCheckOutDate());
        if (nights <= 0) {
            throw new IllegalArgumentException("Reservation date range is invalid for billing");
        }

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice()
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal roomCharge = roomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal vatBase = roomCharge.add(safeServiceCharges)
                .setScale(MONEY_SCALE, ROUNDING);
        BigDecimal vatAmount = vatBase.multiply(vatRate)
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal balanceDue = nonNegative(vatBase.add(vatAmount).subtract(safeDiscount));
        BigDecimal totalPaid = sanitise(reservation.getTotalPaid());
        BigDecimal outstandingBalance = calculateOutstanding(sanitise(reservation.getTotalPrice()), totalPaid);
        String paymentStatus = reservation.getPaymentStatus() != null
                ? reservation.getPaymentStatus().name()
                : "UNPAID";

        List<BillLineItem> lineItems = buildLineItems(
                nights, roomRate, roomCharge, safeServiceCharges, vatAmount, safeDiscount, balanceDue);

        String metadata = String.format(
                "nights=%d roomCharge=%s svcCharges=%s vatAmount=%s discount=%s balanceDue=%s paymentStatus=%s",
                nights, roomCharge, safeServiceCharges, vatAmount, safeDiscount, balanceDue, paymentStatus);

        if (auditBillCalculated) {
            auditService.log("BILL_CALCULATED", normalizedConfirmation, metadata);
            log.info(
                    "Bill calculated for {} | nights={} roomCharge={} svcCharges={} vat={} discount={} balanceDue={} paymentStatus={}",
                    normalizedConfirmation, nights, roomCharge, safeServiceCharges, vatAmount, safeDiscount,
                    balanceDue, paymentStatus);
        }

        BillResponse response = new BillResponse(
                reservation.getConfirmationNumber(),
                reservation.getGuest().getName(),
                reservation.getRoom().getRoomNumber(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                nights,
                roomRate,
                roomCharge,
                safeServiceCharges,
                vatRate,
                vatAmount,
                safeDiscount,
                balanceDue,
                lineItems);

        response.setTotalPaid(totalPaid);
        response.setOutstandingBalance(outstandingBalance);
        response.setInvoiceFinalized(reservation.isInvoiceFinalized());
        response.setPaymentStatus(paymentStatus);
        return response;
    }

    private List<BillLineItem> buildLineItems(
            long nights,
            BigDecimal roomRate,
            BigDecimal roomCharge,
            BigDecimal serviceCharges,
            BigDecimal vatAmount,
            BigDecimal discount,
            BigDecimal balanceDue) {

        List<BillLineItem> items = new ArrayList<>();
        items.add(new BillLineItem(
                String.format("Room Charge (%d night%s x %s)", nights, nights == 1 ? "" : "s", roomRate),
                roomCharge,
                false));

        if (serviceCharges.compareTo(BigDecimal.ZERO) > 0) {
            items.add(new BillLineItem("Additional Service Charges", serviceCharges, false));
        }

        String vatPct = vatRate.multiply(BigDecimal.valueOf(100))
                .stripTrailingZeros()
                .toPlainString();
        items.add(new BillLineItem("VAT (" + vatPct + "%)", vatAmount, false));

        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            items.add(new BillLineItem("Discount", discount, true));
        }

        items.add(new BillLineItem("Balance Due", balanceDue, false));
        return items;
    }

    private BigDecimal sanitise(BigDecimal value) {
        return (value == null || value.compareTo(BigDecimal.ZERO) < 0)
                ? BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)
                : value.setScale(MONEY_SCALE, ROUNDING);
    }

    private String normaliseConfirmationNumber(String confirmationNumber) {
        if (confirmationNumber == null || confirmationNumber.isBlank()) {
            throw new IllegalArgumentException("Confirmation number is required");
        }
        return confirmationNumber.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal nonNegative(BigDecimal value) {
        BigDecimal scaled = value.setScale(MONEY_SCALE, ROUNDING);
        return scaled.compareTo(BigDecimal.ZERO) < 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)
                : scaled;
    }

    private BigDecimal calculateOutstanding(BigDecimal totalPrice, BigDecimal totalPaid) {
        BigDecimal outstanding = sanitise(totalPrice).subtract(sanitise(totalPaid)).setScale(MONEY_SCALE, ROUNDING);
        return outstanding.compareTo(BigDecimal.ZERO) < 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)
                : outstanding;
    }
}
