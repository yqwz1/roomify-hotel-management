package com.roomify.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.roomify.backend.entity.*;
import com.roomify.backend.repository.*;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceChargeService {

    private final ServiceChargeRepository chargeRepo;
    private final HotelServiceRepository serviceRepo; // ✅ FIXED
    private final ReservationRepository reservationRepo;
    private final AuditService auditService;

    // ✅ GET BY RESERVATION
    public List<ServiceCharge> getByReservation(Long reservationId) {
        return chargeRepo.findByReservationId(reservationId);
    }

    // ✅ ADD
    public ServiceCharge addCharge(Long reservationId, Long serviceId, int quantity) {

        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        Reservation reservation = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        validateReservation(reservation);

        HotelService service = serviceRepo.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        ServiceCharge charge = new ServiceCharge();
        charge.setReservation(reservation);
        charge.setService(service);
        charge.setPrice(service.getPrice());
        charge.setQuantity(quantity);

        BigDecimal total = service.getPrice()
                .multiply(BigDecimal.valueOf(quantity));

        charge.setTotal(total);

        chargeRepo.save(charge);

        // 🔥 تحديث الفاتورة
        updateReservationTotal(reservation, total);

        // 🔥 Audit Log
        auditService.log(
                "ADD_SERVICE_CHARGE",
                "Reservation#" + reservation.getId(),
                "Service=" + service.getName() +
                        ", Quantity=" + quantity +
                        ", Amount=" + total);

        return charge;
    }

    // ✅ UPDATE
    public ServiceCharge updateQuantity(Long chargeId, int quantity) {

        ServiceCharge charge = chargeRepo.findById(chargeId)
                .orElseThrow(() -> new RuntimeException("Charge not found"));

        validateReservation(charge.getReservation());

        BigDecimal oldTotal = charge.getTotal();

        charge.setQuantity(quantity);

        BigDecimal newTotal = charge.getPrice()
                .multiply(BigDecimal.valueOf(quantity));

        charge.setTotal(newTotal);

        chargeRepo.save(charge);

        BigDecimal diff = newTotal.subtract(oldTotal);
        updateReservationTotal(charge.getReservation(), diff);

        return charge;
    }

    // ✅ DELETE
    public void removeCharge(Long chargeId) {

        ServiceCharge charge = chargeRepo.findById(chargeId)
                .orElseThrow(() -> new RuntimeException("Charge not found"));

        validateReservation(charge.getReservation());

        updateReservationTotal(
                charge.getReservation(),
                charge.getTotal().negate());

        chargeRepo.delete(charge);
    }

    // 🔥 VALIDATION
    private void validateReservation(Reservation reservation) {

        if (reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new RuntimeException("Checked-out guests are blocked");
        }

        if (reservation.isInvoiceFinalized()) {
            throw new RuntimeException("Bill is not editable");
        }
    }

    // 🔥 UPDATE BILL
    private void updateReservationTotal(Reservation reservation, BigDecimal amount) {

        reservation.setTotalPrice(
                reservation.getTotalPrice().add(amount));

        reservation.setOutstandingBalance(
                reservation.getOutstandingBalance().add(amount));

        reservationRepo.save(reservation);
    }
}