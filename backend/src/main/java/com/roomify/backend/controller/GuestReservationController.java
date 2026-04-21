package com.roomify.backend.controller;

import com.roomify.backend.dto.GuestProfileResponse;
import com.roomify.backend.dto.GuestProfileUpdateRequest;
import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.service.GuestReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/guest")
@PreAuthorize("hasRole('GUEST')")
@RequiredArgsConstructor
public class GuestReservationController {

    private final GuestReservationService guestReservationService;

    @GetMapping("/profile")
    public ResponseEntity<GuestProfileResponse> getGuestProfile() {
        return ResponseEntity.ok(guestReservationService.getGuestProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<GuestProfileResponse> updateGuestProfile(
            @Valid @RequestBody GuestProfileUpdateRequest request) {
        return ResponseEntity.ok(guestReservationService.updateGuestProfile(request));
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<GuestReservationSummaryDto>> getGuestReservations() {
        return ResponseEntity.ok(guestReservationService.getGuestReservations());
    }

    @GetMapping("/reservations/{confirmationNumber}")
    public ResponseEntity<ReservationResponse> getGuestReservation(
            @PathVariable String confirmationNumber) {
        return ResponseEntity.ok(guestReservationService.getGuestReservation(confirmationNumber));
    }

    @PostMapping("/reservations")
    public ResponseEntity<ReservationResponse> createGuestReservation(
            @Valid @RequestBody ReservationCreateRequest request) {
        ReservationResponse response = guestReservationService.createGuestReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/reservations/{confirmationNumber}")
    public ResponseEntity<ReservationActionPlaceholderResponse> modifyGuestReservation(
            @PathVariable String confirmationNumber,
            @Valid @RequestBody ReservationModifyRequest request) {
        return ResponseEntity.ok(
                guestReservationService.modifyGuestReservation(confirmationNumber, request));
    }

    @PostMapping("/reservations/{confirmationNumber}/cancel")
    public ResponseEntity<ReservationActionPlaceholderResponse> cancelGuestReservation(
            @PathVariable String confirmationNumber,
            @RequestBody(required = false) ReservationCancelRequest request) {
        ReservationCancelRequest effectiveRequest = request != null ? request : new ReservationCancelRequest();
        return ResponseEntity.ok(
                guestReservationService.cancelGuestReservation(confirmationNumber, effectiveRequest));
    }
}
