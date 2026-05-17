package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.entity.Reservation;

import java.util.List;

public interface GuestReservationService {
    List<GuestReservationSummaryDto> getGuestReservations();
    List<Long> getAuthenticatedGuestIds();
    Reservation requireActiveGuestReservationForRoom(Long roomId);
    void assertGuestOwnsReservation(String confirmationNumber);
}
