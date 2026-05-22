package com.roomify.backend.notification;

import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ReservationStatus;
import com.roomify.backend.repository.ReservationRepository;
import com.roomify.backend.service.EmailService;
import com.roomify.backend.service.NotificationService;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final NotificationEmailService deliveryService;
    private final NotificationProperties notificationProperties;

    public NotificationScheduler(
            ReservationRepository reservationRepository,
            EmailService emailService,
            NotificationService notificationService,
            NotificationEmailService deliveryService,
            NotificationProperties notificationProperties) {
        this.reservationRepository = reservationRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.deliveryService = deliveryService;
        this.notificationProperties = notificationProperties;
    }

    @Scheduled(cron = "${roomify.notification.scheduler.checkin-reminder-cron:0 0 9 * * *}")
    public void sendCheckInReminders() {
        if (!notificationProperties.isSchedulingEnabled()) {
            return;
        }

        List<Reservation> reservations = reservationRepository.findAllByCheckInDateAndStatusIn(
                LocalDate.now().plusDays(1),
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED));

        reservations.stream()
                .limit(notificationProperties.getRemindersBatchSize())
                .forEach(reservation -> {
                    emailService.sendCheckInReminderEmail(reservation, "en");
                    notificationService.notifyCheckInReminder(reservation);
                });

        if (!reservations.isEmpty()) {
            log.info("Queued {} check-in reminders", Math.min(reservations.size(), notificationProperties.getRemindersBatchSize()));
        }
    }

    @Scheduled(cron = "${roomify.notification.scheduler.payment-reminder-cron:0 30 9 * * *}")
    public void sendPaymentReminders() {
        if (!notificationProperties.isSchedulingEnabled()) {
            return;
        }

        List<Reservation> reservations = reservationRepository.findOutstandingReservationsForReminder(
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN),
                LocalDate.now(),
                LocalDate.now().plusDays(3));

        reservations.stream()
                .limit(notificationProperties.getRemindersBatchSize())
                .forEach(reservation -> emailService.sendPaymentReminderEmail(reservation, "en"));
    }

    @Scheduled(cron = "${roomify.notification.scheduler.retry-cron:0 */10 * * * *}")
    public void retryFailedEmailDeliveries() {
        if (!notificationProperties.isSchedulingEnabled()) {
            return;
        }
        deliveryService.dispatchDueRetries();
    }
}
