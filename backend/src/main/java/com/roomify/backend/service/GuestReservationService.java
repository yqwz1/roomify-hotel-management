package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Reservation;

import java.util.List;

public interface GuestReservationService {
    List<GuestReservationSummaryDto> getGuestReservations();
    ReservationResponse createAuthenticatedGuestReservation(ReservationCreateRequest request);
    List<Long> getAuthenticatedGuestIds();
    Reservation requireActiveGuestReservationForRoom(Long roomId);
    void assertGuestOwnsReservation(String confirmationNumber);
}
