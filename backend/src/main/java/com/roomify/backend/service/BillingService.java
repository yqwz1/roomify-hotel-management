package com.roomify.backend.service;

import com.roomify.backend.dto.BillLineItem;
import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class BillingService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final ReservationRepository reservationRepository;
    private final BigDecimal vatRate;

    public BillingService(
            ReservationRepository reservationRepository,
            @Value("${roomify.billing.vat-rate:0.15}") BigDecimal vatRate) {
        this.reservationRepository = reservationRepository;
        this.vatRate = vatRate;
    }

    public BillResponse calculateBill(
            String confirmationNumber,
            BigDecimal serviceCharges,
            BigDecimal discountAmount) {

        Reservation reservation = reservationRepository.findByConfirmationNumber(confirmationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reservation not found with confirmation number: " + confirmationNumber));

        BigDecimal svcCharges = sanitise(serviceCharges);
        BigDecimal discount = sanitise(discountAmount);

        long nights = ChronoUnit.DAYS.between(
                reservation.getCheckInDate(), reservation.getCheckOutDate());

        BigDecimal roomRate = reservation.getRoom().getRoomType().getBasePrice()
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal roomCharge = roomRate
                .multiply(BigDecimal.valueOf(nights))
                .setScale(MONEY_SCALE, ROUNDING);

        BigDecimal vatBase = roomCharge.add(svcCharges).setScale(MONEY_SCALE, ROUNDING);
        BigDecimal vatAmount = vatBase.multiply(vatRate).setScale(MONEY_SCALE, ROUNDING);

        BigDecimal balanceDue = vatBase.add(vatAmount).subtract(discount)
                .setScale(MONEY_SCALE, ROUNDING);

        List<BillLineItem> lineItems = buildLineItems(
                nights, roomRate, roomCharge, svcCharges, vatRate, vatAmount, discount, balanceDue);

        return new BillResponse(
                reservation.getConfirmationNumber(),
                reservation.getGuest().getName(),
                reservation.getRoom().getRoomNumber(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                nights,
                roomRate,
                roomCharge,
                svcCharges,
                vatRate,
                vatAmount,
                discount,
                balanceDue,
                lineItems);
    }

    private List<BillLineItem> buildLineItems(
            long nights,
            BigDecimal roomRate,
            BigDecimal roomCharge,
            BigDecimal svcCharges,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal discount,
            BigDecimal balanceDue) {

        List<BillLineItem> items = new ArrayList<>();

        items.add(new BillLineItem(
                String.format("Room Charge (%d night%s × %s)", nights, nights == 1 ? "" : "s", roomRate),
                roomCharge,
                false));

        if (svcCharges.compareTo(BigDecimal.ZERO) > 0) {
            items.add(new BillLineItem("Additional Service Charges", svcCharges, false));
        }

        String vatPct = vatRate.multiply(BigDecimal.valueOf(100))
                .stripTrailingZeros().toPlainString();
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
}
