package com.roomify.backend.service;

import com.roomify.backend.dto.PricingBreakdownDto;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ReservationFinancialService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final BigDecimal vatRate;

    public ReservationFinancialService(@Value("${roomify.billing.vat-rate:0.15}") BigDecimal vatRate) {
        this.vatRate = vatRate;
    }

    public ReservationFinancialSummary summarize(Reservation reservation) {
        PricingBreakdownDto quote = quote(
                reservation.getRoom().getRoomType().getBasePrice(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate());
        BigDecimal totalPaid = sanitize(reservation.getTotalPaid());
        BigDecimal outstandingBalance = calculateOutstanding(quote.getTotal(), totalPaid);
        PaymentStatus paymentStatus = resolvePaymentStatus(reservation.getPaymentStatus(), totalPaid, outstandingBalance);
        boolean invoiceFinalized = reservation.isInvoiceFinalized()
                || (totalPaid.compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)) > 0
                        && outstandingBalance.compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)) == 0);

        return new ReservationFinancialSummary(
                quote.getNights(),
                quote.getPricePerNight(),
                quote.getSubtotal(),
                quote.getVatAmount(),
                quote.getTotal(),
                totalPaid,
                outstandingBalance,
                paymentStatus,
                invoiceFinalized);
    }

    public PricingBreakdownDto quote(BigDecimal basePrice, LocalDate checkInDate, LocalDate checkOutDate) {
        BigDecimal roomRate = sanitize(basePrice);
        long nights = checkInDate != null && checkOutDate != null
                ? Math.max(ChronoUnit.DAYS.between(checkInDate, checkOutDate), 0)
                : 0;
        BigDecimal subtotal = roomRate.multiply(BigDecimal.valueOf(nights)).setScale(MONEY_SCALE, ROUNDING);
        BigDecimal seasonalAdjustment = BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING);
        BigDecimal discountAmount = BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING);
        BigDecimal taxableBase = subtotal.add(seasonalAdjustment).subtract(discountAmount);
        BigDecimal vatAmount = taxableBase.multiply(vatRate).setScale(MONEY_SCALE, ROUNDING);
        BigDecimal total = taxableBase.add(vatAmount).setScale(MONEY_SCALE, ROUNDING);

        return new PricingBreakdownDto(
                nights,
                roomRate,
                subtotal,
                seasonalAdjustment,
                discountAmount,
                vatRate.setScale(MONEY_SCALE, ROUNDING),
                vatAmount,
                total,
                "STANDARD_VAT_READY",
                null);
    }

    public boolean syncReservation(Reservation reservation) {
        ReservationFinancialSummary summary = summarize(reservation);
        boolean changed = false;

        if (moneyDiffers(reservation.getTotalPrice(), summary.totalPrice())) {
            reservation.setTotalPrice(summary.totalPrice());
            changed = true;
        }

        if (moneyDiffers(reservation.getTotalPaid(), summary.totalPaid())) {
            reservation.setTotalPaid(summary.totalPaid());
            changed = true;
        }

        if (moneyDiffers(reservation.getOutstandingBalance(), summary.outstandingBalance())) {
            reservation.setOutstandingBalance(summary.outstandingBalance());
            changed = true;
        }

        if (reservation.getPaymentStatus() != summary.paymentStatus()) {
            reservation.setPaymentStatus(summary.paymentStatus());
            changed = true;
        }

        if (reservation.isInvoiceFinalized() != summary.invoiceFinalized()) {
            reservation.setInvoiceFinalized(summary.invoiceFinalized());
            changed = true;
        }

        return changed;
    }

    public BigDecimal calculateOutstanding(BigDecimal totalPrice, BigDecimal totalPaid) {
        BigDecimal outstanding = sanitize(totalPrice)
                .subtract(sanitize(totalPaid))
                .setScale(MONEY_SCALE, ROUNDING);

        return outstanding.compareTo(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)) < 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING)
                : outstanding;
    }

    public BigDecimal sanitize(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING);
        }
        return value.setScale(MONEY_SCALE, ROUNDING);
    }

    private PaymentStatus resolvePaymentStatus(
            PaymentStatus currentStatus,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance) {

        BigDecimal zero = BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING);

        if (outstandingBalance.compareTo(zero) == 0 && totalPaid.compareTo(zero) > 0) {
            return PaymentStatus.PAID;
        }

        if (totalPaid.compareTo(zero) > 0) {
            return PaymentStatus.PARTIALLY_PAID;
        }

        if (currentStatus == PaymentStatus.FAILED) {
            return PaymentStatus.FAILED;
        }

        if (currentStatus == PaymentStatus.PENDING
                || currentStatus == PaymentStatus.PROCESSING
                || currentStatus == PaymentStatus.CANCELLED
                || currentStatus == PaymentStatus.REFUNDED) {
            return currentStatus;
        }

        return PaymentStatus.UNPAID;
    }

    private boolean moneyDiffers(BigDecimal left, BigDecimal right) {
        return sanitize(left).compareTo(sanitize(right)) != 0;
    }

    public record ReservationFinancialSummary(
            long nights,
            BigDecimal roomRate,
            BigDecimal subtotal,
            BigDecimal taxes,
            BigDecimal totalPrice,
            BigDecimal totalPaid,
            BigDecimal outstandingBalance,
            PaymentStatus paymentStatus,
            boolean invoiceFinalized) {
    }
}
