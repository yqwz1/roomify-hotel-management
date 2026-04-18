package com.roomify.backend.controller;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.service.GuestReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/guest/reservations")
@RequiredArgsConstructor
public class GuestReservationController {

    private final GuestReservationService guestReservationService;

    @GetMapping
    public ResponseEntity<List<GuestReservationSummaryDto>> getGuestReservations(
            @RequestParam Long guestId) {

        List<GuestReservationSummaryDto> reservations =
                guestReservationService.getGuestReservations(guestId);

        return ResponseEntity.ok(reservations);
    }
}