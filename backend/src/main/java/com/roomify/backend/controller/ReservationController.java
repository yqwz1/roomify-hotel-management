package com.roomify.backend.controller;

import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationLookupResponse;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.service.BillingService;
import com.roomify.backend.service.ReservationLookupService;
import com.roomify.backend.service.ReservationService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
@PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
public class ReservationController {

    private final ReservationService reservationService;
    private final ReservationLookupService reservationLookupService;
    private final BillingService billingService;

    public ReservationController(
            ReservationService reservationService,
            ReservationLookupService reservationLookupService,
            BillingService billingService) {
        this.reservationService = reservationService;
        this.reservationLookupService = reservationLookupService;
        this.billingService = billingService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody ReservationCreateRequest request) {
        ReservationResponse response = reservationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/search")
    public ResponseEntity<ReservationLookupResponse> search(
            @RequestParam(required = false) String confirmation,
            @RequestParam(required = false) String guestName) {
        ReservationLookupResponse response = reservationLookupService.search(confirmation, guestName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{confirmationNumber}")
    public ResponseEntity<ReservationResponse> getByConfirmationNumber(@PathVariable String confirmationNumber) {
        ReservationResponse response = reservationService.getByConfirmationNumber(confirmationNumber);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReservationActionPlaceholderResponse> modify(
            @PathVariable Long id,
            @Valid @RequestBody ReservationModifyRequest request) {
        ReservationActionPlaceholderResponse response = reservationService.modify(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ReservationActionPlaceholderResponse> cancel(
            @PathVariable Long id,
            @Valid @RequestBody ReservationCancelRequest request) {
        ReservationActionPlaceholderResponse response = reservationService.cancel(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/check-in/{confirmationNumber}")
    public ResponseEntity<ReservationResponse> checkIn(
            @PathVariable String confirmationNumber) {

        ReservationResponse response = reservationService.checkIn(confirmationNumber);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/check-out/{confirmationNumber}")
    public ResponseEntity<ReservationActionPlaceholderResponse> checkOut(
            @PathVariable String confirmationNumber) {
        ReservationActionPlaceholderResponse response = reservationService.checkOut(confirmationNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{confirmationNumber}/bill")
    public ResponseEntity<BillResponse> getBill(
            @PathVariable String confirmationNumber,
            @RequestParam(defaultValue = "0.00") BigDecimal serviceCharges,
            @RequestParam(defaultValue = "0.00") BigDecimal discountAmount) {
        BillResponse bill = billingService.calculateBill(confirmationNumber, serviceCharges, discountAmount);
        return ResponseEntity.ok(bill);
    }
}
