package com.roomify.backend.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.dto.ReservationResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ServiceRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

@Service
public class NotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(NotificationEmailService.class);
    private static final String TEMPLATE_NAME = "email/notification-email";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;
    private final EmailNotificationRepository emailNotificationRepository;
    private final NotificationProperties notificationProperties;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<NotificationEmailService> selfProvider;

    @Value("${roomify.mail.from}")
    private String fromAddress;

    @Value("${roomify.mail.reset-base-url:http://localhost:5173/reset-password}")
    private String passwordResetBaseUrl;

    public NotificationEmailService(
            JavaMailSender mailSender,
            EmailTemplateService templateService,
            EmailNotificationRepository emailNotificationRepository,
            NotificationProperties notificationProperties,
            ObjectMapper objectMapper,
            ObjectProvider<NotificationEmailService> selfProvider) {
        this.mailSender = mailSender;
        this.templateService = templateService;
        this.emailNotificationRepository = emailNotificationRepository;
        this.notificationProperties = notificationProperties;
        this.objectMapper = objectMapper;
        this.selfProvider = selfProvider;
    }

    public void sendReservationConfirmationEmail(
            String recipient,
            String guestName,
            ReservationResponse reservation,
            String localeTag) {
        queue(buildReservationCreatedEvent(recipient, guestName, reservation, localeTag));
    }

    public void sendReservationCancellationEmail(
            String recipient,
            String guestName,
            String room,
            String checkIn,
            String checkOut,
            String total,
            String confirmation,
            String localeTag) {
        queue(buildReservationCancelledEvent(
                recipient,
                guestName,
                room,
                checkIn,
                checkOut,
                total,
                confirmation,
                localeTag));
    }

    public void sendReservationModificationEmail(
            String recipient,
            String oldRoom,
            String newRoom,
            String oldCheckIn,
            String newCheckIn,
            String oldCheckOut,
            String newCheckOut,
            String newTotal,
            String confirmation,
            String localeTag) {
        queue(buildReservationModifiedEvent(
                recipient,
                oldRoom,
                newRoom,
                oldCheckIn,
                newCheckIn,
                oldCheckOut,
                newCheckOut,
                newTotal,
                confirmation,
                localeTag));
    }

    public void sendReceiptEmail(
            String recipient,
            String guestName,
            String confirmationNumber,
            String receiptNumber,
            String invoiceNumber,
            String paymentMethod,
            String paymentDate,
            String amount,
            String localeTag) {
        queue(buildPaymentCompletedEvent(
                recipient,
                guestName,
                confirmationNumber,
                receiptNumber,
                invoiceNumber,
                paymentMethod,
                paymentDate,
                amount,
                localeTag));
    }

    public void sendStaffWelcomeEmail(
            String recipient,
            String name,
            String password,
            String localeTag) {
        queue(buildStaffWelcomeEvent(recipient, name, password, localeTag));
    }

    public void sendGuestWelcomeEmail(
            String recipient,
            String name,
            String localeTag) {
        queue(buildGuestWelcomeEvent(recipient, name, localeTag));
    }

    public void sendCheckInReminderEmail(Reservation reservation, String localeTag) {
        queue(buildCheckInReminderEvent(reservation, localeTag));
    }

    public void sendPaymentReminderEmail(Reservation reservation, String localeTag) {
        queue(buildPaymentReminderEvent(reservation, localeTag));
    }

    public void sendRoomReadyEmail(Reservation reservation, String localeTag) {
        queue(buildRoomReadyEvent(reservation, localeTag));
    }

    public void sendServiceRequestCompletedEmail(ServiceRequest serviceRequest, String localeTag) {
        queue(buildServiceRequestCompletedEvent(serviceRequest, localeTag));
    }

    public void sendPasswordResetEmail(String recipient, String displayName, String rawToken, String localeTag) {
        String resetLink = passwordResetBaseUrl + "?token=" + rawToken;
        queue(buildPasswordResetEvent(recipient, displayName, rawToken, resetLink, localeTag));
    }

    public void sendInvoiceEmail(String recipient, byte[] pdf, String invoiceNumber) {
        validateRecipient(recipient);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipient);
            helper.setFrom(fromAddress);
            helper.setSubject("Roomify Invoice " + invoiceNumber);
            helper.setText("""
                    Dear Guest,

                    Please find attached your Roomify invoice.

                    Invoice Number: %s

                    Regards,
                    Roomify
                    """.formatted(invoiceNumber));
            helper.addAttachment("invoice-" + invoiceNumber + ".pdf", new ByteArrayResource(pdf));
            mailSender.send(message);
        } catch (MessagingException | MailException ex) {
            throw new RuntimeException("Failed to send invoice email", ex);
        }
    }

    public List<EmailNotification> listEmailNotifications(
            String recipient,
            NotificationDeliveryStatus status,
            NotificationType type) {
        return emailNotificationRepository.search(
                StringUtils.hasText(recipient) ? recipient.trim() : null,
                status,
                type);
    }

    public long countByStatus(NotificationDeliveryStatus status) {
        return emailNotificationRepository.countByStatus(status);
    }

    public Optional<EmailNotification> retry(Long notificationId) {
        return emailNotificationRepository.findById(notificationId)
                .map(notification -> {
                    notification.setStatus(NotificationDeliveryStatus.PENDING);
                    notification.setNextAttemptAt(LocalDateTime.now());
                    notification.setErrorMessage(null);
                    EmailNotification saved = emailNotificationRepository.save(notification);
                    triggerAfterCommit(saved.getId());
                    return saved;
                });
    }

    public void dispatchDueRetries() {
        List<EmailNotification> due = emailNotificationRepository.findDueForDispatch(
                List.of(NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.FAILED),
                LocalDateTime.now(),
                notificationProperties.getMaxAttempts());

        due.stream()
                .limit(notificationProperties.getRetryBatchSize())
                .forEach(notification -> triggerAfterCommit(notification.getId()));
    }

    public Optional<EmailNotification> queue(NotificationEvent event) {
        if (event == null || !StringUtils.hasText(event.recipient())) {
            return Optional.empty();
        }

        validateRecipient(event.recipient());
        enforceRateLimits(event);

        if (StringUtils.hasText(event.idempotencyKey())) {
            Optional<EmailNotification> existing = emailNotificationRepository.findByIdempotencyKey(event.idempotencyKey());
            if (existing.isPresent()) {
                return existing;
            }
        }

        EmailNotification notification = new EmailNotification();
        notification.setRecipient(event.recipient().trim());
        notification.setType(event.type());
        notification.setStatus(NotificationDeliveryStatus.PENDING);
        notification.setSubject(event.subject());
        notification.setTemplateName(event.templateName());
        notification.setTemplatePayload(writePayload(event.templateModel()));
        notification.setReferenceType(event.referenceType());
        notification.setReferenceId(event.referenceId());
        notification.setIdempotencyKey(event.idempotencyKey());
        notification.setLocaleTag(templateService.normalizeLocale(event.locale()));
        notification.setNextAttemptAt(LocalDateTime.now());

        EmailNotification saved = emailNotificationRepository.save(notification);
        triggerAfterCommit(saved.getId());
        return Optional.of(saved);
    }

    @Async("notificationTaskExecutor")
    public void dispatchAsync(Long notificationId) {
        emailNotificationRepository.findById(notificationId)
                .ifPresent(this::dispatchSingle);
    }

    private void dispatchSingle(EmailNotification notification) {
        if (notification.getStatus() == NotificationDeliveryStatus.SENT) {
            return;
        }

        notification.setStatus(NotificationDeliveryStatus.PROCESSING);
        notification.setLastAttemptAt(LocalDateTime.now());
        notification.setAttemptCount(notification.getAttemptCount() + 1);
        emailNotificationRepository.save(notification);

        try {
            Map<String, Object> payload = readPayload(notification.getTemplatePayload());
            NotificationEvent event = new NotificationEvent(
                    notification.getType(),
                    notification.getRecipient(),
                    null,
                    notification.getSubject(),
                    notification.getTemplateName(),
                    notification.getLocaleTag(),
                    notification.getReferenceType(),
                    notification.getReferenceId(),
                    notification.getIdempotencyKey(),
                    payload);

            String html = templateService.render(event);
            sendHtml(notification.getRecipient(), notification.getSubject(), html);

            notification.setStatus(NotificationDeliveryStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            notification.setNextAttemptAt(null);
            notification.setErrorMessage(null);
            emailNotificationRepository.save(notification);
            log.info("Email notification {} sent to {}", notification.getId(), notification.getRecipient());
        } catch (Exception ex) {
            handleDeliveryFailure(notification, ex);
        }
    }

    private void sendHtml(String recipient, String subject, String html) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(recipient);
        helper.setFrom(fromAddress);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private void handleDeliveryFailure(EmailNotification notification, Exception ex) {
        notification.setStatus(NotificationDeliveryStatus.FAILED);
        notification.setErrorMessage(truncateError(ex));

        if (notification.getAttemptCount() >= notificationProperties.getMaxAttempts()) {
            notification.setNextAttemptAt(null);
        } else {
            notification.setNextAttemptAt(LocalDateTime.now().plusMinutes(calculateRetryDelay(notification.getAttemptCount())));
        }

        emailNotificationRepository.save(notification);

        if (ex instanceof MailAuthenticationException) {
            log.error("SMTP authentication failed while sending notification {}", notification.getId(), ex);
        } else {
            log.warn("Failed to send notification {} to {}", notification.getId(), notification.getRecipient(), ex);
        }
    }

    private int calculateRetryDelay(int attemptCount) {
        int base = notificationProperties.getInitialRetryDelayMinutes();
        int multiplier = (int) Math.pow(2, Math.max(0, attemptCount - 1));
        long delay = (long) base * multiplier;
        return (int) Math.min(delay, notificationProperties.getMaxRetryDelayMinutes());
    }

    private void validateRecipient(String recipient) {
        try {
            InternetAddress address = new InternetAddress(recipient);
            address.validate();
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid recipient email address");
        }
    }

    private void enforceRateLimits(NotificationEvent event) {
        LocalDateTime now = LocalDateTime.now();
        long hourlyCount = emailNotificationRepository.countByRecipientAndCreatedAtAfter(
                event.recipient().trim(),
                now.minusHours(1));
        if (hourlyCount >= notificationProperties.getPerRecipientPerHourLimit()) {
            throw new IllegalStateException("Email rate limit exceeded for recipient");
        }

        long dailyCount = emailNotificationRepository.countByRecipientAndTypeAndCreatedAtAfter(
                event.recipient().trim(),
                event.type(),
                now.minusDays(1));
        if (dailyCount >= notificationProperties.getPerRecipientPerDayLimit()) {
            throw new IllegalStateException("Daily notification limit exceeded for recipient and type");
        }
    }

    private void triggerAfterCommit(Long notificationId) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatchThroughProxy(notificationId);
                }
            });
            return;
        }
        dispatchThroughProxy(notificationId);
    }

    private void dispatchThroughProxy(Long notificationId) {
        selfProvider.getObject().dispatchAsync(notificationId);
    }

    private String writePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(templateService.sanitizeModel(payload));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize email payload", ex);
        }
    }

    private Map<String, Object> readPayload(String payload) {
        try {
            return objectMapper.readValue(payload, MAP_TYPE);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to parse email payload", ex);
        }
    }

    private String truncateError(Exception ex) {
        String message = ex.getMessage();
        if (!StringUtils.hasText(message)) {
            message = ex.getClass().getSimpleName();
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }

    private NotificationEvent buildReservationCreatedEvent(
            String recipient,
            String guestName,
            ReservationResponse reservation,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "تأكيد الحجز من روميفاي" : "Your Roomify reservation is confirmed.");
        model.put("heroEyebrow", arabic ? "تأكيد الحجز" : "Reservation confirmed");
        model.put("heading", arabic ? "تم تأكيد إقامتك" : "Your stay is confirmed");
        model.put("greeting", arabic ? "عزيزي/عزيزتي " + guestName : "Dear " + guestName);
        model.put("intro", arabic
                ? "يسعدنا تأكيد حجزك. ستجد أدناه أهم تفاصيل الإقامة."
                : "We are pleased to confirm your reservation. Your stay details are below.");
        model.put("accentLabel", arabic ? "رقم التأكيد" : "Confirmation number");
        model.put("accentValue", reservation.getConfirmationNumber());
        model.put("details", orderedMap(
                arabic ? "الغرفة" : "Room", reservation.getRoomNumber(),
                arabic ? "تاريخ الوصول" : "Check-in", String.valueOf(reservation.getCheckInDate()),
                arabic ? "تاريخ المغادرة" : "Check-out", String.valueOf(reservation.getCheckOutDate()),
                arabic ? "الإجمالي" : "Total", String.valueOf(reservation.getTotalPrice())));
        model.put("bodyLines", arabic
                ? List.of("يرجى إبراز رقم التأكيد عند الوصول.", "إذا احتجت إلى تعديل الحجز، تواصل مع فريق الاستقبال.")
                : List.of("Please keep your confirmation number available for arrival.", "If you need any changes before arrival, contact the front desk."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.RESERVATION_CREATED,
                recipient,
                guestName,
                arabic ? "تأكيد الحجز - روميفاي" : "Reservation Confirmation - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                reservation.getConfirmationNumber(),
                "reservation-created:" + reservation.getConfirmationNumber(),
                model);
    }

    private NotificationEvent buildReservationCancelledEvent(
            String recipient,
            String guestName,
            String room,
            String checkIn,
            String checkOut,
            String total,
            String confirmation,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "تم إلغاء الحجز" : "Your reservation has been cancelled.");
        model.put("heroEyebrow", arabic ? "إلغاء الحجز" : "Reservation cancelled");
        model.put("heading", arabic ? "تمت معالجة الإلغاء" : "Your cancellation is complete");
        model.put("greeting", arabic ? "عزيزي/عزيزتي " + guestName : "Dear " + guestName);
        model.put("intro", arabic
                ? "تم إلغاء الحجز التالي بنجاح."
                : "The following reservation has been cancelled successfully.");
        model.put("accentLabel", arabic ? "رقم التأكيد" : "Confirmation number");
        model.put("accentValue", confirmation);
        model.put("details", orderedMap(
                arabic ? "الغرفة" : "Room", room,
                arabic ? "تاريخ الوصول" : "Check-in", checkIn,
                arabic ? "تاريخ المغادرة" : "Check-out", checkOut,
                arabic ? "الإجمالي" : "Total", total));
        model.put("bodyLines", arabic
                ? List.of("إذا كنت ترغب في حجز جديد، يسعدنا خدمتك في أي وقت.")
                : List.of("If you would like to make a new reservation, we would be happy to assist you."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.RESERVATION_CANCELLED,
                recipient,
                guestName,
                arabic ? "إلغاء الحجز - روميفاي" : "Reservation Cancelled - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                confirmation,
                "reservation-cancelled:" + confirmation,
                model);
    }

    private NotificationEvent buildReservationModifiedEvent(
            String recipient,
            String oldRoom,
            String newRoom,
            String oldCheckIn,
            String newCheckIn,
            String oldCheckOut,
            String newCheckOut,
            String newTotal,
            String confirmation,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "تم تحديث الحجز" : "Your reservation was updated.");
        model.put("heroEyebrow", arabic ? "تعديل الحجز" : "Reservation updated");
        model.put("heading", arabic ? "تم تحديث تفاصيل الإقامة" : "Your stay details changed");
        model.put("greeting", arabic ? "مرحباً" : "Hello");
        model.put("intro", arabic
                ? "تم تعديل الحجز، والتفاصيل الجديدة موضحة أدناه."
                : "Your reservation has been updated. The new details are shown below.");
        model.put("accentLabel", arabic ? "رقم التأكيد" : "Confirmation number");
        model.put("accentValue", confirmation);
        model.put("details", orderedMap(
                arabic ? "الغرفة السابقة" : "Previous room", oldRoom,
                arabic ? "الغرفة الجديدة" : "New room", newRoom,
                arabic ? "الوصول السابق" : "Previous check-in", oldCheckIn,
                arabic ? "الوصول الجديد" : "New check-in", newCheckIn,
                arabic ? "المغادرة السابقة" : "Previous check-out", oldCheckOut,
                arabic ? "المغادرة الجديدة" : "New check-out", newCheckOut,
                arabic ? "الإجمالي الجديد" : "Updated total", newTotal));
        model.put("bodyLines", arabic
                ? List.of("إذا كانت لديك أي أسئلة، يرجى الرد على هذا البريد أو التواصل مع الاستقبال.")
                : List.of("If you have any questions, reply to this email or contact the front desk."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.RESERVATION_MODIFIED,
                recipient,
                null,
                arabic ? "تعديل الحجز - روميفاي" : "Reservation Updated - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                confirmation,
                "reservation-modified:" + confirmation + ":" + newCheckIn + ":" + newCheckOut,
                model);
    }

    private NotificationEvent buildPaymentCompletedEvent(
            String recipient,
            String guestName,
            String confirmationNumber,
            String receiptNumber,
            String invoiceNumber,
            String paymentMethod,
            String paymentDate,
            String amount,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "تم استلام دفعتك" : "Your payment was received.");
        model.put("heroEyebrow", arabic ? "إيصال الدفع" : "Payment received");
        model.put("heading", arabic ? "تمت معالجة الدفع بنجاح" : "Your payment is complete");
        model.put("greeting", arabic ? "عزيزي/عزيزتي " + guestName : "Dear " + guestName);
        model.put("intro", arabic
                ? "نشكر لك إتمام الدفع. فيما يلي ملخص العملية."
                : "Thank you for completing your payment. Here is the transaction summary.");
        model.put("accentLabel", arabic ? "رقم الإيصال" : "Receipt number");
        model.put("accentValue", receiptNumber);
        model.put("details", orderedMap(
                arabic ? "رقم التأكيد" : "Confirmation number", confirmationNumber,
                arabic ? "رقم الفاتورة" : "Invoice number", invoiceNumber,
                arabic ? "طريقة الدفع" : "Payment method", paymentMethod,
                arabic ? "تاريخ الدفع" : "Payment date", paymentDate,
                arabic ? "المبلغ" : "Amount", amount));
        model.put("bodyLines", arabic
                ? List.of("سيظهر هذا التحديث في حالة الفاتورة الخاصة بإقامتك.")
                : List.of("This update will also be reflected in your stay billing status."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.PAYMENT_COMPLETED,
                recipient,
                guestName,
                arabic ? "تم استلام الدفع - روميفاي" : "Payment Receipt - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                confirmationNumber,
                "payment-completed:" + confirmationNumber + ":" + receiptNumber,
                model);
    }

    private NotificationEvent buildCheckInReminderEvent(Reservation reservation, String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "تذكير بوصولك غداً" : "Your check-in is tomorrow.");
        model.put("heroEyebrow", arabic ? "تذكير الوصول" : "Check-in reminder");
        model.put("heading", arabic ? "ننتظرك غداً" : "We look forward to welcoming you tomorrow");
        model.put("greeting", greetingForReservation(reservation, arabic));
        model.put("intro", arabic
                ? "هذا تذكير بأن موعد الوصول لحجزك خلال 24 ساعة."
                : "This is a reminder that your reservation check-in is within the next 24 hours.");
        model.put("accentLabel", arabic ? "رقم التأكيد" : "Confirmation number");
        model.put("accentValue", reservation.getConfirmationNumber());
        model.put("details", orderedMap(
                arabic ? "الغرفة" : "Room", reservation.getRoom().getRoomNumber(),
                arabic ? "تاريخ الوصول" : "Check-in", String.valueOf(reservation.getCheckInDate()),
                arabic ? "تاريخ المغادرة" : "Check-out", String.valueOf(reservation.getCheckOutDate())));
        model.put("bodyLines", arabic
                ? List.of("إذا كنت ستصل متأخراً، نرجو إبلاغ فريق الاستقبال.", "نتمنى لك إقامة مريحة.")
                : List.of("If you expect a late arrival, please let the front desk know.", "We look forward to hosting you."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.CHECKIN_REMINDER,
                reservation.getGuest().getEmail(),
                reservation.getGuest().getName(),
                arabic ? "تذكير الوصول - روميفاي" : "Check-In Reminder - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                reservation.getConfirmationNumber(),
                "checkin-reminder:" + reservation.getConfirmationNumber() + ":" + reservation.getCheckInDate(),
                model);
    }

    private NotificationEvent buildPaymentReminderEvent(Reservation reservation, String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "يوجد رصيد مستحق على الحجز" : "Your reservation still has an outstanding balance.");
        model.put("heroEyebrow", arabic ? "تذكير بالدفع" : "Payment reminder");
        model.put("heading", arabic ? "هناك مبلغ متبقٍ على الحجز" : "A balance is still due for your stay");
        model.put("greeting", greetingForReservation(reservation, arabic));
        model.put("intro", arabic
                ? "نرسل لك هذا التذكير لتسوية الرصيد المتبقي قبل الوصول أو عند الاستقبال."
                : "This is a reminder to settle the remaining balance before arrival or at the front desk.");
        model.put("accentLabel", arabic ? "الرصيد المستحق" : "Outstanding balance");
        model.put("accentValue", String.valueOf(reservation.getOutstandingBalance()));
        model.put("details", orderedMap(
                arabic ? "رقم التأكيد" : "Confirmation number", reservation.getConfirmationNumber(),
                arabic ? "تاريخ الوصول" : "Check-in", String.valueOf(reservation.getCheckInDate()),
                arabic ? "الإجمالي" : "Reservation total", String.valueOf(reservation.getTotalPrice()),
                arabic ? "المدفوع" : "Paid to date", String.valueOf(reservation.getTotalPaid())));
        model.put("bodyLines", arabic
                ? List.of("إذا تم السداد بالفعل مؤخراً، يمكنك تجاهل هذا التذكير.")
                : List.of("If you recently completed the payment, please disregard this reminder."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.PAYMENT_REMINDER,
                reservation.getGuest().getEmail(),
                reservation.getGuest().getName(),
                arabic ? "تذكير بالدفع - روميفاي" : "Payment Reminder - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                reservation.getConfirmationNumber(),
                "payment-reminder:" + reservation.getConfirmationNumber() + ":" + LocalDate.now(),
                model);
    }

    private NotificationEvent buildRoomReadyEvent(Reservation reservation, String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "غرفتك جاهزة الآن" : "Your room is ready.");
        model.put("heroEyebrow", arabic ? "تحديث الغرفة" : "Room update");
        model.put("heading", arabic ? "غرفتك أصبحت جاهزة" : "Your room is now ready");
        model.put("greeting", greetingForReservation(reservation, arabic));
        model.put("intro", arabic
                ? "تم تجهيز الغرفة ويمكن لفريق الاستقبال متابعة إجراءات الوصول معك."
                : "Your room has been prepared and the front desk can now assist with check-in.");
        model.put("accentLabel", arabic ? "رقم الغرفة" : "Room number");
        model.put("accentValue", reservation.getRoom().getRoomNumber());
        model.put("details", orderedMap(
                arabic ? "رقم التأكيد" : "Confirmation number", reservation.getConfirmationNumber(),
                arabic ? "تاريخ الوصول" : "Check-in", String.valueOf(reservation.getCheckInDate()),
                arabic ? "تاريخ المغادرة" : "Check-out", String.valueOf(reservation.getCheckOutDate())));
        model.put("bodyLines", arabic
                ? List.of("إذا كنت في الفندق بالفعل، يمكنك التوجه إلى الاستقبال لإكمال الإجراءات.")
                : List.of("If you are already on property, please head to the front desk to complete arrival formalities."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.ROOM_READY,
                reservation.getGuest().getEmail(),
                reservation.getGuest().getName(),
                arabic ? "غرفتك جاهزة - روميفاي" : "Room Ready - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "RESERVATION",
                reservation.getConfirmationNumber(),
                "room-ready:" + reservation.getConfirmationNumber() + ":" + reservation.getRoom().getRoomNumber(),
                model);
    }

    private NotificationEvent buildServiceRequestCompletedEvent(ServiceRequest serviceRequest, String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "تم إكمال طلب الخدمة" : "Your service request has been completed.");
        model.put("heroEyebrow", arabic ? "تحديث الخدمة" : "Service request update");
        model.put("heading", arabic ? "تم تنفيذ طلبك" : "Your request has been completed");
        model.put("greeting", arabic
                ? "عزيزي/عزيزتي " + serviceRequest.getGuest().getName()
                : "Dear " + serviceRequest.getGuest().getName());
        model.put("intro", arabic
                ? "يسعدنا إبلاغك بأنه تم إكمال طلب الخدمة التالي."
                : "We are pleased to let you know that the following service request has been completed.");
        model.put("accentLabel", arabic ? "نوع الطلب" : "Request type");
        model.put("accentValue", serviceRequest.getServiceType().name());
        model.put("details", orderedMap(
                arabic ? "رقم الغرفة" : "Room number", serviceRequest.getRoom().getRoomNumber(),
                arabic ? "الأولوية" : "Priority", serviceRequest.getPriority().name(),
                arabic ? "الوصف" : "Description", serviceRequest.getDescription()));
        model.put("bodyLines", arabic
                ? List.of("إذا كنت بحاجة إلى مساعدة إضافية، يمكنك إرسال طلب جديد من بوابة النزيل.")
                : List.of("If you need anything else, you can submit a new request from the guest portal."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.SERVICE_REQUEST_COMPLETED,
                serviceRequest.getGuest().getEmail(),
                serviceRequest.getGuest().getName(),
                arabic ? "تم إكمال طلب الخدمة - روميفاي" : "Service Request Completed - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "SERVICE_REQUEST",
                String.valueOf(serviceRequest.getId()),
                "service-request-completed:" + serviceRequest.getId(),
                model);
    }

    private NotificationEvent buildPasswordResetEvent(
            String recipient,
            String displayName,
            String rawToken,
            String resetLink,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "استخدم هذا الرابط لإعادة تعيين كلمة المرور" : "Use this link to reset your Roomify password.");
        model.put("heroEyebrow", arabic ? "إعادة تعيين كلمة المرور" : "Password reset");
        model.put("heading", arabic ? "طلب إعادة تعيين كلمة المرور" : "Password reset request");
        model.put("greeting", arabic ? "مرحباً " + displayName : "Hello " + displayName);
        model.put("intro", arabic
                ? "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم الرابط أو الرمز أدناه لإكمال العملية."
                : "We received a request to reset your password. Use the link or code below to complete the process.");
        model.put("accentLabel", arabic ? "رمز التحقق" : "Reset code");
        model.put("accentValue", rawToken);
        model.put("ctaText", arabic ? "إعادة تعيين كلمة المرور" : "Reset password");
        model.put("ctaHref", resetLink);
        model.put("details", orderedMap(
                arabic ? "صلاحية الرابط" : "Link validity", arabic ? "30 دقيقة" : "30 minutes",
                arabic ? "إذا لم تطلب ذلك" : "If this was not you", arabic ? "يمكنك تجاهل الرسالة بأمان" : "You can safely ignore this email"));
        model.put("bodyLines", arabic
                ? List.of("لأمانك، ينتهي الرابط بعد 30 دقيقة.", "لا تشارك رمز التحقق مع أي شخص.")
                : List.of("For your security, the reset link expires in 30 minutes.", "Do not share the reset code with anyone."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.PASSWORD_RESET,
                recipient,
                displayName,
                arabic ? "إعادة تعيين كلمة المرور - روميفاي" : "Password Reset - Roomify",
                TEMPLATE_NAME,
                localeTag,
                "PASSWORD_RESET",
                recipient,
                "password-reset:" + recipient + ":" + rawToken,
                model);
    }

    private NotificationEvent buildStaffWelcomeEvent(
            String recipient,
            String name,
            String password,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "بيانات الدخول إلى بوابة الموظفين" : "Your Roomify staff account is ready.");
        model.put("heroEyebrow", arabic ? "حساب الموظف" : "Staff access");
        model.put("heading", arabic ? "تم إنشاء حسابك" : "Your staff account is ready");
        model.put("greeting", arabic ? "مرحباً " + name : "Hello " + name);
        model.put("intro", arabic
                ? "تم إنشاء حسابك في بوابة روميفاي للموظفين. استخدم بيانات الدخول المؤقتة التالية."
                : "Your Roomify staff account has been created. Use the temporary access details below.");
        model.put("accentLabel", arabic ? "كلمة المرور المؤقتة" : "Temporary password");
        model.put("accentValue", password);
        model.put("details", orderedMap(
                arabic ? "البريد الإلكتروني" : "Email", recipient,
                arabic ? "الإجراء المطلوب" : "Required action", arabic ? "غيّر كلمة المرور بعد أول تسجيل دخول" : "Change your password after first login"));
        model.put("bodyLines", arabic
                ? List.of("إذا تعذر تسجيل الدخول، تواصل مع مسؤول النظام.")
                : List.of("If you cannot sign in, contact your system administrator."));
        model.put("signature", arabic ? "فريق روميفاي" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.STAFF_WELCOME,
                recipient,
                name,
                arabic ? "مرحباً بك في روميفاي" : "Welcome to Roomify",
                TEMPLATE_NAME,
                localeTag,
                "STAFF",
                recipient,
                "staff-welcome:" + recipient,
                model);
    }

    private NotificationEvent buildGuestWelcomeEvent(
            String recipient,
            String name,
            String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = baseModel(localeTag);
        model.put("preheader", arabic ? "Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¶ÙŠÙ Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ Ø¬Ø§Ù‡Ø²." : "Your Roomify guest account is ready.");
        model.put("heroEyebrow", arabic ? "Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¶ÙŠÙ" : "Guest access");
        model.put("heading", arabic ? "Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ø±ÙˆÙ…ÙŠÙØ§ÙŠ" : "Welcome to Roomify");
        model.put("greeting", arabic ? "Ù…Ø±Ø­Ø¨Ø§Ù‹ " + name : "Hello " + name);
        model.put("intro", arabic
                ? "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¶ÙŠÙ Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø¥Ù‚Ø§Ù…Ø§ØªÙƒ ÙˆØ®Ø¯Ù…Ø§ØªÙƒ."
                : "Your Roomify guest account has been created. You can now sign in to manage your stays and services.");
        model.put("accentLabel", arabic ? "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" : "Account email");
        model.put("accentValue", recipient);
        model.put("details", orderedMap(
                arabic ? "Ù†ÙˆØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨" : "Account type", arabic ? "Ø¶ÙŠÙ" : "Guest",
                arabic ? "Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©" : "Next step", arabic ? "Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø§Ø³ØªØ¹Ø±Ø§Ø¶ Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª ÙˆØ·Ù„Ø¨ Ø§Ù„Ø®Ø¯Ù…Ø§Øª" : "Sign in to view reservations and request services"));
        model.put("bodyLines", arabic
                ? List.of("Ø­Ø³Ø§Ø¨Ùƒ Ø¬Ø§Ù‡Ø² Ù…ØªÙ‰ Ù…Ø§ Ø§Ø­ØªØ¬ØªÙ‡.", "Ø¥Ø°Ø§ Ø§Ø­ØªØ¬Øª Ø¥Ù„Ù‰ Ù…Ø³Ø§Ø¹Ø¯Ø©ØŒ ÙØ±ÙŠÙ‚ Ø±ÙˆÙ…ÙŠÙØ§ÙŠ Ø¬Ø§Ù‡Ø² Ù„Ø®Ø¯Ù…ØªÙƒ.")
                : List.of("Your account is ready whenever you are.", "If you need help before or during your stay, the Roomify team is ready to assist."));
        model.put("signature", arabic ? "ÙØ±ÙŠÙ‚ Ø±ÙˆÙ…ÙŠÙØ§ÙŠ" : "Roomify Team");
        return new NotificationEvent(
                NotificationType.GUEST_WELCOME,
                recipient,
                name,
                arabic ? "Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ø±ÙˆÙ…ÙŠÙØ§ÙŠ" : "Welcome to Roomify",
                TEMPLATE_NAME,
                localeTag,
                "GUEST",
                recipient,
                "guest-welcome:" + recipient,
                model);
    }

    private Map<String, Object> baseModel(String localeTag) {
        boolean arabic = templateService.isArabic(localeTag);
        Map<String, Object> model = new LinkedHashMap<>();
        model.put("supportEmail", "support@roomify.com");
        model.put("footerText", arabic
                ? "هذه رسالة تشغيلية مرسلة من نظام إدارة الفندق Roomify."
                : "This is an operational email sent by the Roomify hotel management system.");
        model.put("currentYear", String.valueOf(LocalDate.now().getYear()));
        return model;
    }

    private String greetingForReservation(Reservation reservation, boolean arabic) {
        String guestName = reservation.getGuest() != null ? reservation.getGuest().getName() : "";
        return arabic ? "عزيزي/عزيزتي " + guestName : "Dear " + guestName;
    }

    private Map<String, String> orderedMap(String key1, String value1, String key2, String value2) {
        Map<String, String> details = new LinkedHashMap<>();
        details.put(key1, value1);
        details.put(key2, value2);
        return details;
    }

    private Map<String, String> orderedMap(
            String key1,
            String value1,
            String key2,
            String value2,
            String key3,
            String value3) {
        Map<String, String> details = orderedMap(key1, value1, key2, value2);
        details.put(key3, value3);
        return details;
    }

    private Map<String, String> orderedMap(
            String key1,
            String value1,
            String key2,
            String value2,
            String key3,
            String value3,
            String key4,
            String value4) {
        Map<String, String> details = orderedMap(key1, value1, key2, value2, key3, value3);
        details.put(key4, value4);
        return details;
    }

    private Map<String, String> orderedMap(
            String key1,
            String value1,
            String key2,
            String value2,
            String key3,
            String value3,
            String key4,
            String value4,
            String key5,
            String value5) {
        Map<String, String> details = orderedMap(key1, value1, key2, value2, key3, value3, key4, value4);
        details.put(key5, value5);
        return details;
    }

    private Map<String, String> orderedMap(
            String key1,
            String value1,
            String key2,
            String value2,
            String key3,
            String value3,
            String key4,
            String value4,
            String key5,
            String value5,
            String key6,
            String value6,
            String key7,
            String value7) {
        Map<String, String> details = orderedMap(key1, value1, key2, value2, key3, value3, key4, value4, key5, value5);
        details.put(key6, value6);
        details.put(key7, value7);
        return details;
    }
}
