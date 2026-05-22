# Notification API

## In-App Notification Center

### `GET /api/notifications`

Returns notifications visible to the current authenticated user.

Optional query params:

- `read=true|false`

### `GET /api/notifications/unread-count`

Returns:

```json
{ "unreadCount": 3 }
```

### `PATCH /api/notifications/{id}/read`

Marks a visible notification as read.

### `PATCH /api/notifications/{id}/unread`

Marks a visible notification as unread.

## Email Delivery Admin Endpoints

Admin role required.

### `GET /api/notifications/email-deliveries`

Optional query params:

- `recipient`
- `status`
- `type`

Example:

```http
GET /api/notifications/email-deliveries?status=FAILED&type=PAYMENT_REMINDER
```

### `GET /api/notifications/email-deliveries/stats`

Example response:

```json
{
  "pending": 2,
  "processing": 1,
  "sent": 124,
  "failed": 4
}
```

### `POST /api/notifications/email-deliveries/{id}/retry`

Requeues a failed notification for delivery.

## Password Reset

### `POST /api/auth/password-reset/request`

Request body:

```json
{
  "email": "staff@roomify.com"
}
```

Response:

- `202 Accepted`

### `POST /api/auth/password-reset/confirm`

Request body:

```json
{
  "token": "AB12CD34",
  "newPassword": "NewStrongPassword123!"
}
```

Response:

- `204 No Content`
