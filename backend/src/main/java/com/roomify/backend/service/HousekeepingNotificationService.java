package com.roomify.backend.service;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.entity.Room;
import com.roomify.backend.repository.ReservationRepository;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HousekeepingNotificationService {

    private static final Logger log =
            LoggerFactory.getLogger(HousekeepingNotificationService.class);

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public HousekeepingNotificationService(
            ReservationRepository reservationRepository,
            EmailService emailService,
            NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    public void notifyCheckoutNeedsCleaning(Room room) {
        log.info("HOUSEKEEPING_ROUTING: checkout alert sent for room {}", room.getRoomNumber());
        notificationService.createNotification(
                com.roomify.backend.entity.NotificationEventType.SERVICE_REQUEST_CREATED,
                com.roomify.backend.user.Role.STAFF,
                "HOUSEKEEPING",
                "Room needs cleaning",
                "Room " + room.getRoomNumber() + " needs housekeeping after checkout.",
                "ROOM",
                room.getRoomNumber());
    }

    public void notifyRoomReady(Room room) {
        log.info("HOUSEKEEPING_ROUTING: room ready alert sent for room {}", room.getRoomNumber());

        List<Reservation> upcomingReservations = reservationRepository.findUpcomingReservationsForRoom(
                room.getId(),
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                LocalDate.now());

        if (upcomingReservations.isEmpty()) {
            return;
        }

        Reservation reservation = upcomingReservations.getFirst();
        notificationService.notifyRoomReady(reservation);
        emailService.sendRoomReadyEmail(reservation, org.springframework.context.i18n.LocaleContextHolder.getLocale().toLanguageTag());
    }
}
