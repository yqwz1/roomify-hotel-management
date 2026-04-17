package com.roomify.backend.controller;

import com.roomify.backend.dto.GuestReservationsResponse;
import com.roomify.backend.service.GuestReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guest/reservations")
@RequiredArgsConstructor
public class GuestReservationController {

    private final GuestReservationService guestReservationService;

    @GetMapping
    public ResponseEntity<GuestReservationsResponse> getGuestReservations() {
        GuestReservationsResponse response =
                new GuestReservationsResponse(guestReservationService.getGuestReservations());

        return ResponseEntity.ok(response);
    }
}