package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestReservationServiceImpl implements GuestReservationService {

    private final ReservationRepository reservationRepository;

    @Override
    public List<GuestReservationSummaryDto> getGuestReservations() {
        List<Reservation> reservations = reservationRepository.findAll();

        return reservations.stream()
                .map(this::mapToDto)
                .toList();
    }

    private GuestReservationSummaryDto mapToDto(Reservation reservation) {
        String roomNumber = null;
        String roomType = null;

        if (reservation.getRoom() != null) {
            roomNumber = reservation.getRoom().getRoomNumber();

            if (reservation.getRoom().getRoomType() != null) {
                roomType = reservation.getRoom().getRoomType().getName();
            }
        }

        return new GuestReservationSummaryDto(
                reservation.getConfirmationNumber(),
                reservation.getStatus() != null ? reservation.getStatus().name() : null,
                roomNumber,
                roomType,
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                reservation.getTotalPrice(),
                reservation.getPaymentStatus() != null ? reservation.getPaymentStatus().name() : null,
                reservation.getInvoiceNumber(),
                reservation.isInvoiceFinalized()
        );
    }
}