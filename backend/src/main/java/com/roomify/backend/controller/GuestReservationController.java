package com.roomify.backend.controller;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.service.GuestReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/guest/reservations")
@PreAuthorize("hasRole('GUEST')")
@RequiredArgsConstructor
public class GuestReservationController {

    private final GuestReservationService guestReservationService;

    @GetMapping
    public ResponseEntity<List<GuestReservationSummaryDto>> getGuestReservations() {

        List<GuestReservationSummaryDto> reservations =
                guestReservationService.getGuestReservations();

        return ResponseEntity.ok(reservations);
    }
}
