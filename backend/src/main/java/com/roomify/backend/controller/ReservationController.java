package com.roomify.backend.controller;

import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
@PreAuthorize("hasAnyRole('MANAGER', 'STAFF')") 
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * Create reservation (MANAGER or STAFF)
     */
    @PostMapping
    public ResponseEntity<ReservationResponse> create(
            @Valid @RequestBody ReservationCreateRequest request) {

        ReservationResponse response = reservationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get reservation by confirmation number
     */
    @GetMapping("/{confirmationNumber}")
    public ResponseEntity<ReservationResponse> getByConfirmationNumber(
            @PathVariable String confirmationNumber) {

        ReservationResponse response =
                reservationService.getByConfirmationNumber(confirmationNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ STAFF ONLY - Perform check-in
     */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasRole('STAFF')")  // 🔥 override class-level rule
    public ResponseEntity<ReservationResponse> checkIn(@PathVariable Long id) {

        ReservationResponse response = reservationService.checkIn(id);
        return ResponseEntity.ok(response);
    }
}