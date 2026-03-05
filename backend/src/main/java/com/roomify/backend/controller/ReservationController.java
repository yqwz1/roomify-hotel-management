package com.roomify.backend.controller;

import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationLookupResponse;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.service.ReservationLookupService;
import com.roomify.backend.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    public ReservationController(ReservationService reservationService,
            ReservationLookupService reservationLookupService) {
        this.reservationService = reservationService;
        this.reservationLookupService = reservationLookupService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody ReservationCreateRequest request) {
        ReservationResponse response = reservationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{confirmationNumber}")
    public ResponseEntity<ReservationResponse> getByConfirmationNumber(@PathVariable String confirmationNumber) {
        ReservationResponse response = reservationService.getByConfirmationNumber(confirmationNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Staff check-in lookup endpoint.
     *
     * <p>
     * Accepts at least one of:
     * <ul>
     * <li>{@code confirmation} – exact confirmation number (e.g.
     * RSV-XXXXXXXXXXXX)</li>
     * <li>{@code guestName} – partial, case-insensitive guest name</li>
     * </ul>
     *
     * <p>
     * Returns 400 if both parameters are omitted, 404 if no reservation matches.
     */
    @GetMapping("/search")
    public ResponseEntity<ReservationLookupResponse> search(
            @RequestParam(required = false) String confirmation,
            @RequestParam(required = false) String guestName) {
        return ResponseEntity.ok(reservationLookupService.search(confirmation, guestName));
    }
}
