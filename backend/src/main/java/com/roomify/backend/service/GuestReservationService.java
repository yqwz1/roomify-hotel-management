package com.roomify.backend.service;

import com.roomify.backend.dto.GuestProfileResponse;
import com.roomify.backend.dto.GuestProfileUpdateRequest;
import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.dto.ReservationActionPlaceholderResponse;
import com.roomify.backend.dto.ReservationCancelRequest;
import com.roomify.backend.dto.ReservationCreateRequest;
import com.roomify.backend.dto.ReservationModifyRequest;
import com.roomify.backend.dto.ReservationResponse;

import java.util.List;

public interface GuestReservationService {
    GuestProfileResponse getGuestProfile();

    GuestProfileResponse updateGuestProfile(GuestProfileUpdateRequest request);

    List<GuestReservationSummaryDto> getGuestReservations();

    ReservationResponse getGuestReservation(String confirmationNumber);

    ReservationResponse createGuestReservation(ReservationCreateRequest request);

    ReservationActionPlaceholderResponse modifyGuestReservation(
            String confirmationNumber,
            ReservationModifyRequest request);

    ReservationActionPlaceholderResponse cancelGuestReservation(
            String confirmationNumber,
            ReservationCancelRequest request);
}
