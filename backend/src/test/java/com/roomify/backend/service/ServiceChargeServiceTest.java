package com.roomify.backend.service;

import com.roomify.backend.entity.HotelService;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.ServiceCharge;
import com.roomify.backend.repository.HotelServiceRepository;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.repository.ServiceChargeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ServiceChargeServiceTest {

    @Mock
    private ServiceChargeRepository chargeRepo;

    @Mock
    private HotelServiceRepository serviceRepo;

    @Mock
    private ReservationRepository reservationRepo;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ServiceChargeService serviceChargeService;

    private Reservation reservation;
    private ServiceCharge serviceCharge;
    private HotelService hotelService;

    @BeforeEach
    void setUp() {
        reservation = new Reservation();
        reservation.setId(1L);
        reservation.setConfirmationNumber("CONF-123");
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setPaymentStatus(PaymentStatus.UNPAID);
        reservation.setInvoiceFinalized(false);
        reservation.setTotalPrice(BigDecimal.valueOf(100));
        reservation.setOutstandingBalance(BigDecimal.valueOf(100));

        hotelService = new HotelService();
        hotelService.setId(10L);
        hotelService.setName("Spa");
        hotelService.setPrice(BigDecimal.valueOf(50));

        serviceCharge = new ServiceCharge();
        serviceCharge.setReservation(reservation);
        serviceCharge.setService(hotelService);
        serviceCharge.setPrice(BigDecimal.valueOf(50));
        serviceCharge.setQuantity(1);
        serviceCharge.setTotal(BigDecimal.valueOf(50));
    }

    @Test
    void testRemoveChargeWithoutReason_ThrowsException() {
        assertThrows(RuntimeException.class, () -> serviceChargeService.removeCharge(100L, null));
        assertThrows(RuntimeException.class, () -> serviceChargeService.removeCharge(100L, "  "));
    }

    @Test
    void testAddChargeSuccess_TriggersNotification() {
        when(reservationRepo.findById(1L)).thenReturn(Optional.of(reservation));
        when(serviceRepo.findById(10L)).thenReturn(Optional.of(hotelService));
        when(chargeRepo.save(any(ServiceCharge.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ServiceCharge created = serviceChargeService.addCharge(1L, 10L, 2);

        assertEquals(BigDecimal.valueOf(100), created.getTotal());
    }

    @Test
    void testAddChargeWithInactiveService_ThrowsException() {
        hotelService.setActive(false);
        when(reservationRepo.findById(1L)).thenReturn(Optional.of(reservation));
        when(serviceRepo.findById(10L)).thenReturn(Optional.of(hotelService));

        Exception exception = assertThrows(RuntimeException.class, () -> serviceChargeService.addCharge(1L, 10L, 1));

        assertEquals("Service is inactive", exception.getMessage());
        verify(chargeRepo, never()).save(any(ServiceCharge.class));
    }

    @Test
    void testModifyChargeWhenPaid_ThrowsException() {
        reservation.setPaymentStatus(PaymentStatus.PAID);
        when(chargeRepo.findById(100L)).thenReturn(Optional.of(serviceCharge));

        Exception exception = assertThrows(RuntimeException.class, () -> serviceChargeService.updateQuantity(100L, 2));
        assertEquals("Paid bills cannot be modified", exception.getMessage());
    }

    @Test
    void testRemoveChargeWhenPaid_ThrowsException() {
        reservation.setPaymentStatus(PaymentStatus.PAID);
        when(chargeRepo.findById(100L)).thenReturn(Optional.of(serviceCharge));

        Exception exception = assertThrows(RuntimeException.class, () -> serviceChargeService.removeCharge(100L, "Mistake"));
        assertEquals("Paid bills cannot be modified", exception.getMessage());
    }

    @Test
    void testRemoveChargeSuccess_WithAudit() {
        when(chargeRepo.findById(100L)).thenReturn(Optional.of(serviceCharge));
        
        serviceChargeService.removeCharge(100L, "Mistake");
        
        verify(chargeRepo, times(1)).delete(serviceCharge);
        verify(auditService, times(1)).log(eq("DELETE_SERVICE_CHARGE"), anyString(), anyString());
        assertEquals(new BigDecimal("50.00"), reservation.getTotalPrice());
    }

    @Test
    void testUpdateQuantitySuccess_WithAudit() {
        when(chargeRepo.findById(100L)).thenReturn(Optional.of(serviceCharge));
        
        serviceChargeService.updateQuantity(100L, 2);
        
        verify(chargeRepo, times(1)).save(serviceCharge);
        verify(auditService, times(1)).log(eq("UPDATE_SERVICE_CHARGE"), anyString(), anyString());
        assertEquals(new BigDecimal("100"), serviceCharge.getTotal());
        assertEquals(new BigDecimal("150.00"), reservation.getTotalPrice());
    }

}
