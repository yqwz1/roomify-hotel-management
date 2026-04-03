package com.roomify.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomify.backend.entity.*;
import com.roomify.backend.repository.*;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ServiceChargeService {

    private final ServiceChargeRepository chargeRepo;
    private final HotelServiceRepository serviceRepo;
    private final ReservationRepository reservationRepo;

    // ✅ ADD
    @Transactional
    public ServiceCharge addCharge(Long reservationId, Long serviceId, int quantity) {

        Reservation reservation = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        validateReservation(reservation);

        HotelService service = serviceRepo.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (!service.isActive()) {
            throw new RuntimeException("Service is not active");
        }

        ServiceCharge charge = new ServiceCharge();
        charge.setReservation(reservation);
        charge.setService(service);
        charge.setPrice(service.getPrice());
        charge.setQuantity(quantity);

        // ✅ FIX: حساب total هنا
        charge.setTotal(
                service.getPrice().multiply(BigDecimal.valueOf(quantity)));

        return chargeRepo.save(charge);
    }

    // ✅ DELETE
    @Transactional
    public void removeCharge(Long chargeId) {

        ServiceCharge charge = chargeRepo.findById(chargeId)
                .orElseThrow(() -> new RuntimeException("Charge not found"));

        validateReservation(charge.getReservation());

        chargeRepo.delete(charge);
    }

    // ✅ UPDATE
    @Transactional
    public ServiceCharge updateQuantity(Long chargeId, int quantity) {

        ServiceCharge charge = chargeRepo.findById(chargeId)
                .orElseThrow(() -> new RuntimeException("Charge not found"));

        validateReservation(charge.getReservation());

        charge.setQuantity(quantity);

        // ✅ FIX: إعادة حساب total
        charge.setTotal(
                charge.getPrice().multiply(BigDecimal.valueOf(quantity)));

        return chargeRepo.save(charge);
    }

    // 🔥 VALIDATION RULES
    private void validateReservation(Reservation reservation) {

        if (reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new RuntimeException("Guest must be checked-in");
        }

        if (reservation.isInvoiceFinalized()) {
            throw new RuntimeException("Invoice already finalized");
        }
    }
}