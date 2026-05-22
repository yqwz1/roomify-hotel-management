# Roomify Email Notifications

## Overview

Roomify now includes a production-oriented notification module for real SMTP email delivery and in-app notification center updates.

Backend module layout:

```text
backend/src/main/java/com/roomify/backend/notification/
├── EmailNotification.java
├── EmailNotificationRepository.java
├── EmailService.java
├── EmailTemplateService.java
├── NotificationController.java
├── NotificationDeliveryStatus.java
├── NotificationEvent.java
├── NotificationModuleConfig.java
├── NotificationProperties.java
├── NotificationScheduler.java
├── NotificationType.java
├── PasswordResetService.java
├── PasswordResetToken.java
└── dto/
```

Core behavior:

- Real SMTP delivery through Spring Mail
- Async queue-backed delivery using persisted `email_notifications`
- Scheduled check-in reminders
- Scheduled payment reminders
- Scheduled retry processing for failed deliveries
- Delivery history and retry actions for admins
- In-app notification center support for staff, admins, and direct guest notifications

## Supported Events

Email notifications are queued for:

- Reservation created
- Reservation cancelled
- Reservation modified
- Payment completed
- Check-in reminder
- Payment reminder
- Room ready
- Guest service request completed
- Password reset
- Staff welcome

In-app notifications are also created for:

- Reservation created
- Reservation cancelled
- Payment completed
- Check-in reminder
- Room ready
- Service request completed
- Payment failures and incomplete payments
- Routed housekeeping/service alerts

## Environment Variables

Required SMTP and sender settings:

```bash
SPRING_MAIL_HOST=
SPRING_MAIL_PORT=
SPRING_MAIL_USERNAME=
SPRING_MAIL_PASSWORD=
SPRING_MAIL_PROTOCOL=smtp
ROOMIFY_MAIL_FROM=
```

Recommended optional settings:

```bash
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_STARTTLS_ENABLE=true
SPRING_MAIL_CONNECTION_TIMEOUT=5000
SPRING_MAIL_TIMEOUT=5000
SPRING_MAIL_WRITE_TIMEOUT=5000
ROOMIFY_MAIL_RESET_BASE_URL=http://localhost:5173/reset-password
ROOMIFY_NOTIFICATION_MAX_ATTEMPTS=5
ROOMIFY_NOTIFICATION_RETRY_BATCH_SIZE=25
ROOMIFY_NOTIFICATION_REMINDERS_BATCH_SIZE=50
ROOMIFY_NOTIFICATION_PER_RECIPIENT_PER_HOUR_LIMIT=12
ROOMIFY_NOTIFICATION_PER_RECIPIENT_PER_DAY_LIMIT=40
ROOMIFY_NOTIFICATION_INITIAL_RETRY_DELAY_MINUTES=5
ROOMIFY_NOTIFICATION_MAX_RETRY_DELAY_MINUTES=180
ROOMIFY_NOTIFICATION_SCHEDULING_ENABLED=true
```

## Gmail SMTP

Use an App Password, not a primary Google password.

```bash
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_PROTOCOL=smtp
SPRING_MAIL_USERNAME=your-account@gmail.com
SPRING_MAIL_PASSWORD=your-google-app-password
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_STARTTLS_ENABLE=true
ROOMIFY_MAIL_FROM=your-account@gmail.com
```

Notes:

- Enable 2-Step Verification first.
- Generate a Google App Password for the Roomify backend.
- Do not use consumer Gmail for bulk mail.

## Brevo SMTP

Use the SMTP key generated from the Brevo dashboard.

```bash
SPRING_MAIL_HOST=smtp-relay.brevo.com
SPRING_MAIL_PORT=587
SPRING_MAIL_PROTOCOL=smtp
SPRING_MAIL_USERNAME=your-brevo-login
SPRING_MAIL_PASSWORD=your-brevo-smtp-key
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_STARTTLS_ENABLE=true
ROOMIFY_MAIL_FROM=verified-sender@your-domain.com
```

Notes:

- Verify the sender domain in Brevo before production traffic.
- Prefer a domain-based sender instead of a free mailbox.

## Security Notes

- SMTP credentials are read only from environment variables.
- No SMTP password or API secret is exposed through frontend code or backend APIs.
- Email recipients are validated before queueing.
- Template strings are sanitized before rendering.
- Queueing is rate-limited per recipient to reduce abuse.
- Password reset tokens are hashed in the database.
- Password reset tokens expire after 30 minutes and are single-use.

## Scheduler Behavior

Defaults:

- Check-in reminders: daily at `09:00`
- Payment reminders: daily at `09:30`
- Failed delivery retry sweep: every `10` minutes

Override with:

- `roomify.notification.scheduler.checkin-reminder-cron`
- `roomify.notification.scheduler.payment-reminder-cron`
- `roomify.notification.scheduler.retry-cron`

## Frontend Features

- Bell icon in the authenticated navbar
- Live unread count
- Mark as read
- Notification history popover
- Polling-based live refresh every 15 seconds
- Admin delivery dashboard at `/admin/notifications`

## Docker Compatibility

`docker-compose.yml` keeps Mailpit for local development while remaining compatible with production SMTP by using environment-driven settings.

Current dev-safe overrides:

- `SPRING_MAIL_PROTOCOL=smtp`
- `SPRING_MAIL_SMTP_AUTH=false`
- `SPRING_MAIL_STARTTLS_ENABLE=false`
- `ROOMIFY_MAIL_FROM=no-reply@roomify.local`

## Verification

Verified locally in this change set:

- `mvn.cmd test-compile`
- `npm.cmd run build`

Current limitation:

- `mvn.cmd test` does not complete because the repository already contains a broader legacy test-suite compilation problem unrelated to the notification module. The failure appears during Maven test compilation despite `test-compile` succeeding.
