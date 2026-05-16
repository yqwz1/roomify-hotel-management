package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;

import java.util.List;

public interface GuestReservationService {
    List<GuestReservationSummaryDto> getGuestReservations();
    void assertGuestOwnsReservation(String confirmationNumber);
}
