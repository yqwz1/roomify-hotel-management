package com.roomify.backend.service;

import com.roomify.backend.dto.GuestReservationSummaryDto;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestReservationServiceImpl implements GuestReservationService {

    private final ReservationRepository reservationRepository;

    @Override
    public List<GuestReservationSummaryDto> getGuestReservations(Long guestId) {
        LocalDate today = LocalDate.now();

        return reservationRepository.findByGuest_Id(guestId).stream()
                .sorted(buildReservationSort(today))
                .map(this::mapToDto)
                .toList();
    }

    private Comparator<Reservation> buildReservationSort(LocalDate today) {
        return Comparator
                .comparing((Reservation reservation) -> isOlderStay(reservation, today))
                .thenComparing(
                        reservation -> isOlderStay(reservation, today)
                                ? null
                                : reservation.getCheckInDate(),
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(
                        reservation -> isOlderStay(reservation, today)
                                ? reservation.getCheckOutDate()
                                : null,
                        Comparator.nullsLast(Comparator.reverseOrder())
                );
    }

    private boolean isOlderStay(Reservation reservation, LocalDate today) {
        return reservation.getCheckOutDate() != null
                && reservation.getCheckOutDate().isBefore(today);
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