package com.roomify.backend.service;

import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.entity.Guest;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class BillingServiceTest {

    private ReservationRepository reservationRepository;
    private BillingService billingService;

    @BeforeEach
    void setUp() {
        reservationRepository = Mockito.mock(ReservationRepository.class);
        // VAT rate is 15% (0.15)
        billingService = new BillingService(reservationRepository, new BigDecimal("0.15"));
    }

    private Reservation createSampleReservation(String confirmationNumber, LocalDate checkIn, LocalDate checkOut, BigDecimal roomPrice) {
        RoomType rt = new RoomType();
        rt.setBasePrice(roomPrice);

        Room room = new Room();
        room.setRoomNumber("101");
        room.setRoomType(rt);

        Guest guest = new Guest();
        guest.setName("John Doe");

        Reservation reservation = new Reservation();
        reservation.setConfirmationNumber(confirmationNumber);
        reservation.setCheckInDate(checkIn);
        reservation.setCheckOutDate(checkOut);
        reservation.setRoom(room);
        reservation.setGuest(guest);

        return reservation;
    }

    @Test
    void testSample1_BasicBooking_NoExtraCharges() {
        Reservation res = createSampleReservation("RM-1", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 3), new BigDecimal("100.00"));
        when(reservationRepository.findByConfirmationNumber("RM-1")).thenReturn(Optional.of(res));

        // 2 nights @ 100.00 = 200.00. VAT 15% = 30.00. Total = 230.00
        BillResponse bill = billingService.calculateBill("RM-1", BigDecimal.ZERO, BigDecimal.ZERO);

        assertThat(bill.getNights()).isEqualTo(2);
        assertThat(bill.getRoomCharge()).isEqualByComparingTo("200.00");
        assertThat(bill.getVatAmount()).isEqualByComparingTo("30.00");
        assertThat(bill.getBalanceDue()).isEqualByComparingTo("230.00");
    }

    @Test
    void testSample2_WithServiceChargesAndRoundingEdgeCase() {
        Reservation res = createSampleReservation("RM-2", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 4), new BigDecimal("125.55"));
        when(reservationRepository.findByConfirmationNumber("RM-2")).thenReturn(Optional.of(res));

        // 3 nights @ 125.55 = 376.65
        // Service charges = 45.33
        // Subtotal = 376.65 + 45.33 = 421.98
        // Discount = 10.00
        // Taxable Base = 421.98 - 10.00 = 411.98
        // VAT = 411.98 * 0.15 = 61.797 -> half up: 61.80
        // Total = 411.98 + 61.80 = 473.78

        BillResponse bill = billingService.calculateBill("RM-2", new BigDecimal("45.33"), new BigDecimal("10.00"));

        assertThat(bill.getRoomCharge()).isEqualByComparingTo("376.65");
        assertThat(bill.getVatAmount()).isEqualByComparingTo("61.80");
        assertThat(bill.getBalanceDue()).isEqualByComparingTo("473.78");
    }

    @Test
    void testSample3_HighDiscountEdgeCase() {
        Reservation res = createSampleReservation("RM-3", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 1), new BigDecimal("50.00"));
        when(reservationRepository.findByConfirmationNumber("RM-3")).thenReturn(Optional.of(res));

        // 0 nights -> clamped to 1 night @ 50.00 = 50.00
        // Service = 0
        // Subtotal = 50.00
        // Discount = 100.00 (exceeds cost)
        // Taxable Base = max(0, 50.00 - 100.00) = 0.00
        // VAT = 0.00
        // BalanceDue = 0.00
        
        BillResponse bill = billingService.calculateBill("RM-3", BigDecimal.ZERO, new BigDecimal("100.00"));
        
        assertThat(bill.getNights()).isEqualTo(1);
        assertThat(bill.getRoomCharge()).isEqualByComparingTo("50.00");
        assertThat(bill.getVatAmount()).isEqualByComparingTo("0.00");
        assertThat(bill.getBalanceDue()).isEqualByComparingTo("0.00");
    }
}
