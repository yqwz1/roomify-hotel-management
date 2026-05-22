package com.roomify.backend.controller;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationPaymentRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.dto.BillResponse;
import com.roomify.backend.service.GuestReservationService;
import com.roomify.backend.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/guest/reservations")
@PreAuthorize("hasRole('GUEST')")
@RequiredArgsConstructor
public class GuestReservationController {

    private final GuestReservationService guestReservationService;
    private final BillingService billingService;

    @GetMapping
    public ResponseEntity<List<GuestReservationSummaryDto>> getGuestReservations() {
        return ResponseEntity.ok(guestReservationService.getGuestReservations());
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createGuestReservation(
            @Valid @RequestBody ReservationCreateRequest request) {
        ReservationResponse response = guestReservationService.createAuthenticatedGuestReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{confirmationNumber}/bill/payments")
    public ResponseEntity<BillResponse> recordGuestPayment(
            @PathVariable String confirmationNumber,
            @Valid @RequestBody ReservationPaymentRequest request) {
        guestReservationService.assertGuestOwnsReservation(confirmationNumber);
        BillResponse response = billingService.recordPayment(confirmationNumber, request.getAmount());
        return ResponseEntity.ok(response);
    }
}
