package com.roomify.backend.service;

import com.roomify.backend.dto.BillLineItem;
import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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

        BigDecimal safeServiceCharges = sanitise(serviceCharges);
        BigDecimal safeDiscount = sanitise(discountAmount);

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(), reservation.getCheckOutDate());

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice()
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal roomCharge = roomRate.multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal vatBase = roomCharge.add(safeServiceCharges)
                .setScale(MONEY_SCALE, ROUNDING);
        BigDecimal vatAmount = vatBase.multiply(vatRate)
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal balanceDue = vatBase.add(vatAmount).subtract(safeDiscount)
                .setScale(MONEY_SCALE, ROUNDING);

        List<BillLineItem> lineItems = buildLineItems(
                nights, roomRate, roomCharge, safeServiceCharges, vatAmount, safeDiscount, balanceDue);

        String metadata = String.format(
                "nights=%d roomCharge=%s svcCharges=%s vatAmount=%s discount=%s balanceDue=%s",
                nights, roomCharge, safeServiceCharges, vatAmount, safeDiscount, balanceDue);
        auditService.log("BILL_CALCULATED", normalized, metadata);

        log.info(
                "Bill calculated for {} | nights={} roomCharge={} svcCharges={} vat={} discount={} balanceDue={}",
                normalized, nights, roomCharge, safeServiceCharges, vatAmount, safeDiscount, balanceDue);

        return new BillResponse(
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
}
