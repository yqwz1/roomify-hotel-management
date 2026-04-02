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

        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        ServiceCharge charge = chargeRepo.findById(chargeId)
                .orElseThrow(() -> new RuntimeException("Charge not found"));

        validateReservation(charge.getReservation());

        int oldQuantity = charge.getQuantity();
        BigDecimal oldTotal = charge.getTotal();

        charge.setQuantity(quantity);

        BigDecimal newTotal = charge.getPrice()
                .multiply(BigDecimal.valueOf(quantity));

        charge.setTotal(newTotal);

        chargeRepo.save(charge);

        BigDecimal diff = newTotal.subtract(oldTotal);
        updateReservationTotal(charge.getReservation(), diff);

        // 🔥 Audit Log
        auditService.log(
                "UPDATE_SERVICE_CHARGE",
                "Reservation#" + charge.getReservation().getId(),
                "Service=" + charge.getService().getName() +
                        ", OldQuantity=" + oldQuantity +
                        ", NewQuantity=" + quantity +
                        ", OldTotal=" + oldTotal +
                        ", NewTotal=" + newTotal);

        return charge;
    }

    // ✅ DELETE
    public void removeCharge(Long chargeId, String reason) {

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Reason is required for deletion");
        }

        ServiceCharge charge = chargeRepo.findById(chargeId)
                .orElseThrow(() -> new RuntimeException("Charge not found"));

        validateReservation(charge.getReservation());

        updateReservationTotal(
                charge.getReservation(),
                charge.getTotal().negate());

        chargeRepo.delete(charge);

        // 🔥 Audit Log
        auditService.log(
                "DELETE_SERVICE_CHARGE",
                "Reservation#" + charge.getReservation().getId(),
                "Service=" + charge.getService().getName() +
                        ", RemovedQuantity=" + charge.getQuantity() +
                        ", RemovedAmount=" + charge.getTotal() +
                        ", Reason=" + reason);
    }

    // 🔥 VALIDATION
    private void validateReservation(Reservation reservation) {

        if (reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new RuntimeException("Checked-out guests are blocked");
        }

        if (reservation.isInvoiceFinalized()) {
            throw new RuntimeException("Bill is not editable");
        }

        if (reservation.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Paid bills cannot be modified");
        }
    }

    // 🔥 UPDATE BILL
    private void updateReservationTotal(Reservation reservation, BigDecimal amount) {

        BigDecimal newTotal = reservation.getTotalPrice().add(amount)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        reservation.setTotalPrice(newTotal);

        BigDecimal totalPaid = reservation.getTotalPaid() != null
                ? reservation.getTotalPaid().setScale(2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);

        BigDecimal newOutstanding = newTotal.subtract(totalPaid)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        if (newOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            newOutstanding = BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }

        reservation.setOutstandingBalance(newOutstanding);

        if (newOutstanding.compareTo(BigDecimal.ZERO) == 0 && newTotal.compareTo(BigDecimal.ZERO) > 0) {
            reservation.setPaymentStatus(PaymentStatus.PAID);
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            reservation.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        } else {
            reservation.setPaymentStatus(PaymentStatus.UNPAID);
        }

        reservationRepo.save(reservation);
    }
}