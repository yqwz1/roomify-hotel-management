# Floating Guest Assistant Architecture

## Goal

Add a real-time `Floating Guest Assistant` to Roomify that:

- Gives guests a persistent support widget across the app
- Lets staff manage all guest conversations from a live inbox
- Reuses the existing Roomify auth, notification, reservation, and service-request foundations
- Supports AI fallback, translation, unread state, and staff takeover

This design is intentionally aligned with the current codebase:

- Frontend: React + Vite + Tailwind + Framer Motion
- Backend: Spring Boot + JPA + Flyway + PostgreSQL + JWT auth
- Existing assets to reuse:
  - `frontend/src/components/shell/NotificationCenter.jsx`
  - `frontend/src/pages/GuestServiceRequests.jsx`
  - `backend/src/main/java/com/roomify/backend/service/NotificationService.java`
  - `backend/src/main/java/com/roomify/backend/entity/Guest.java`
  - `backend/src/main/java/com/roomify/backend/entity/Reservation.java`

## Product Scope

The feature should cover two connected experiences:

1. Guest-facing floating assistant
- Floating button in the bottom-right corner
- Expandable conversation panel
- Real-time conversation with hotel staff
- AI fallback when staff are offline or slow to respond
- Quick actions for common hotel requests
- Auto-translation for multilingual guests

2. Staff-facing live inbox
- Real-time conversation list
- Unread indicators and sound notifications
- Conversation status and assignment controls
- Inline translation between original, Arabic, and English
- Ability to turn AI-handled threads into human-handled threads at any time

## Architecture Principles

- Do not replace the existing service request module; integrate with it
- Keep chat conversations separate from service request records
- Use service requests as an operational side effect of quick actions
- Keep translation snapshots persisted so staff can review history consistently
- Keep AI replies clearly marked as AI-generated
- Prefer additive changes over modifications to existing reservation and notification flows

## Recommended Delivery Strategy

Deliver in four phases.

### Phase 1: Conversation Core

- Create conversation and message entities
- Add REST APIs for loading inboxes and histories
- Add floating guest widget UI without WebSocket
- Poll every few seconds as a safe first milestone

### Phase 2: Real-Time Layer

- Add Spring WebSocket + SockJS + STOMP
- Replace polling for message delivery and unread counters
- Add staff inbox live updates and online presence

### Phase 3: AI and Translation

- Add translation service abstraction
- Add guest-safe AI assistant flow
- Persist translation snapshots and AI metadata

### Phase 4: Production Hardening

- Sound notifications
- Retry logic and idempotency for quick actions
- Presence heartbeat cleanup
- Metrics, audit events, rate limits, and tests

## Domain Model

### New Entities

#### `GuestConversation`

Represents one support thread between a guest and hotel staff.

Suggested fields:

- `id`
- `publicId` string UUID for frontend-safe references
- `guest_id` nullable false
- `reservation_id` nullable true
- `room_id` nullable true
- `assigned_staff_user_id` nullable true
- `status` enum
- `channel` enum
- `subject` nullable
- `last_message_at`
- `last_message_preview`
- `unread_guest_count`
- `unread_staff_count`
- `ai_mode_enabled`
- `ai_handled`
- `resolved_at`
- `resolved_by_user_id`
- `created_at`
- `updated_at`

Enums:

- `ConversationStatus`: `ACTIVE`, `PENDING`, `RESOLVED`
- `ConversationChannel`: `GUEST_WIDGET`, `QUICK_ACTION`, `AI_ONLY`

#### `GuestConversationMessage`

Represents one message event in a conversation.

Suggested fields:

- `id`
- `conversation_id`
- `sender_type` enum
- `sender_user_id` nullable
- `sender_guest_id` nullable
- `message_type` enum
- `body_original`
- `original_language`
- `body_ar`
- `body_en`
- `body_fr` nullable
- `body_tr` nullable
- `translated_for_guest_body` nullable
- `translated_for_guest_language` nullable
- `ai_generated`
- `quick_action_type` nullable
- `seen_by_guest_at`
- `seen_by_staff_at`
- `delivered_at`
- `created_at`

Enums:

- `MessageSenderType`: `GUEST`, `STAFF`, `AI`, `SYSTEM`
- `MessageType`: `TEXT`, `QUICK_ACTION`, `SERVICE_REQUEST_LINK`, `STATUS_UPDATE`

#### `GuestConversationPresence`

Tracks online status per user session for staff presence and optional guest presence.

Suggested fields:

- `id`
- `user_id` nullable
- `guest_id` nullable
- `session_id`
- `role`
- `status` enum
- `last_seen_at`
- `created_at`

Enum:

- `PresenceStatus`: `ONLINE`, `OFFLINE`, `AWAY`

### Reused Existing Entities

- `Guest`
- `Reservation`
- `Room`
- `User`
- `Notification`
- `ServiceRequest`

## Database Schema

Add Flyway migration: `V22__create_guest_conversation_tables.sql`

### Table: `guest_conversations`

```sql
create table guest_conversations (
  id bigserial primary key,
  public_id uuid not null unique,
  guest_id bigint not null references guests(id),
  reservation_id bigint references reservations(id),
  room_id bigint references rooms(id),
  assigned_staff_user_id bigint references users(id),
  status varchar(20) not null,
  channel varchar(30) not null,
  subject varchar(160),
  last_message_at timestamp not null,
  last_message_preview varchar(280),
  unread_guest_count integer not null default 0,
  unread_staff_count integer not null default 0,
  ai_mode_enabled boolean not null default true,
  ai_handled boolean not null default false,
  resolved_at timestamp,
  resolved_by_user_id bigint references users(id),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index idx_guest_conversations_guest_id on guest_conversations(guest_id);
create index idx_guest_conversations_status on guest_conversations(status);
create index idx_guest_conversations_last_message_at on guest_conversations(last_message_at desc);
create index idx_guest_conversations_assigned_staff on guest_conversations(assigned_staff_user_id);
```

### Table: `guest_conversation_messages`

```sql
create table guest_conversation_messages (
  id bigserial primary key,
  conversation_id bigint not null references guest_conversations(id) on delete cascade,
  sender_type varchar(20) not null,
  sender_user_id bigint references users(id),
  sender_guest_id bigint references guests(id),
  message_type varchar(30) not null,
  body_original text not null,
  original_language varchar(10) not null,
  body_ar text,
  body_en text,
  body_fr text,
  body_tr text,
  translated_for_guest_body text,
  translated_for_guest_language varchar(10),
  ai_generated boolean not null default false,
  quick_action_type varchar(40),
  seen_by_guest_at timestamp,
  seen_by_staff_at timestamp,
  delivered_at timestamp,
  created_at timestamp not null default now()
);

create index idx_guest_conversation_messages_conversation_id
  on guest_conversation_messages(conversation_id, created_at);
create index idx_guest_conversation_messages_sender_type
  on guest_conversation_messages(sender_type);
```

### Table: `guest_conversation_presence`

```sql
create table guest_conversation_presence (
  id bigserial primary key,
  user_id bigint references users(id),
  guest_id bigint references guests(id),
  session_id varchar(120) not null unique,
  role varchar(20) not null,
  status varchar(20) not null,
  last_seen_at timestamp not null,
  created_at timestamp not null default now()
);

create index idx_guest_conversation_presence_user_id on guest_conversation_presence(user_id);
create index idx_guest_conversation_presence_guest_id on guest_conversation_presence(guest_id);
```

## Backend Package Structure

Recommended package layout inside `backend/src/main/java/com/roomify/backend`:

```text
assistant/
  config/
    GuestAssistantWebSocketConfig.java
    GuestAssistantWebSocketSecurityConfig.java
  controller/
    GuestAssistantConversationController.java
    StaffAssistantInboxController.java
    GuestAssistantQuickActionController.java
  dto/
    conversation/
      GuestConversationListItemResponse.java
      GuestConversationDetailResponse.java
      GuestConversationMessageResponse.java
      GuestConversationCreateRequest.java
      GuestConversationReplyRequest.java
      GuestConversationResolveRequest.java
      GuestConversationFilterRequest.java
    realtime/
      GuestChatEnvelope.java
      GuestPresenceEvent.java
      GuestTypingEvent.java
  entity/
    GuestConversation.java
    GuestConversationMessage.java
    GuestConversationPresence.java
    ConversationStatus.java
    ConversationChannel.java
    MessageSenderType.java
    MessageType.java
    PresenceStatus.java
  repository/
    GuestConversationRepository.java
    GuestConversationMessageRepository.java
    GuestConversationPresenceRepository.java
  service/
    GuestConversationService.java
    GuestConversationRealtimeService.java
    GuestQuickActionService.java
    GuestAssistantPresenceService.java
    GuestAssistantNotificationService.java
    GuestAssistantTranslationService.java
    GuestAssistantAiService.java
  support/
    GuestConversationMapper.java
    GuestAssistantSecurity.java
```

## Frontend Folder Structure

Recommended additions in `frontend/src`:

```text
components/guest-assistant/
  FloatingGuestAssistant.jsx
  GuestAssistantLauncher.jsx
  GuestAssistantPanel.jsx
  GuestAssistantHeader.jsx
  GuestAssistantMessageList.jsx
  GuestAssistantMessageBubble.jsx
  GuestAssistantComposer.jsx
  GuestAssistantQuickActions.jsx
  GuestAssistantStatusPill.jsx
  GuestAssistantUnreadBadge.jsx
  GuestAssistantTypingIndicator.jsx
  GuestAssistantTranslationTabs.jsx
  StaffInboxSoundToggle.jsx

components/staff-inbox/
  StaffInboxPageHeader.jsx
  StaffInboxFilters.jsx
  StaffConversationList.jsx
  StaffConversationListItem.jsx
  StaffConversationDetail.jsx
  StaffConversationReplyBox.jsx
  StaffConversationMetaPanel.jsx

hooks/
  useGuestAssistantConversation.js
  useGuestAssistantSocket.js
  useGuestAssistantPresence.js
  useGuestAssistantNotifications.js
  useStaffConversationInbox.js

services/
  guestAssistantService.js
  guestAssistantSocket.js
  guestAssistantTranslationService.js

utils/
  guestAssistantFormatting.js
  guestAssistantPresence.js
  guestAssistantSound.js
  guestAssistantQuickActions.js

pages/
  StaffGuestInbox.jsx
```

## REST API Design

Use additive APIs under `/api/guest-assistant`.

### Guest APIs

#### `GET /api/guest-assistant/conversations/current`

Return the guest’s active conversation for the current stay, or create-on-demand metadata.

Response:

```json
{
  "conversation": {
    "publicId": "8ab0b69d-c4be-4309-8e28-4dbca8d0fd38",
    "status": "ACTIVE",
    "roomNumber": "305",
    "guestName": "Amina Hassan",
    "staffOnline": true,
    "assignedStaffName": "Front Desk",
    "aiModeEnabled": true,
    "unreadGuestCount": 0,
    "lastMessageAt": "2026-05-23T05:45:00"
  }
}
```

#### `GET /api/guest-assistant/conversations/{publicId}/messages`

Fetch conversation history for the guest.

#### `POST /api/guest-assistant/conversations/{publicId}/messages`

Create a guest message.

Request:

```json
{
  "body": "Merhaba, yarın çıkış saatimi uzatabilir miyim?",
  "clientMessageId": "msg-client-001",
  "detectedLanguage": "tr"
}
```

#### `POST /api/guest-assistant/conversations/{publicId}/quick-actions`

Triggers chat + operational workflow.

Request:

```json
{
  "action": "HOUSEKEEPING",
  "body": "Please send housekeeping to room 305."
}
```

Expected behavior:

- Append conversation message
- Optionally create `ServiceRequest`
- Notify staff inbox
- AI may acknowledge instantly if staff unavailable

#### `POST /api/guest-assistant/conversations/{publicId}/seen`

Mark messages seen by guest.

### Staff APIs

#### `GET /api/staff/guest-assistant/conversations`

Filterable inbox.

Query params:

- `status=ACTIVE|PENDING|RESOLVED`
- `aiHandled=true|false`
- `assignedToMe=true|false`
- `roomNumber=305`
- `guestName=amina`

#### `GET /api/staff/guest-assistant/conversations/{publicId}`

Returns conversation details, guest context, and messages.

#### `POST /api/staff/guest-assistant/conversations/{publicId}/messages`

Staff reply endpoint.

Request:

```json
{
  "body": "سنرتب ذلك خلال 10 دقائق",
  "replyLanguage": "ar"
}
```

Server behavior:

- Persist original Arabic text
- Generate English translation for staff-side fallback
- Generate guest-language translation automatically
- Push socket updates to guest and staff subscribers

#### `POST /api/staff/guest-assistant/conversations/{publicId}/assign`

Assign current staff member or named staff member.

#### `POST /api/staff/guest-assistant/conversations/{publicId}/resolve`

Resolve conversation and stop unread growth.

#### `POST /api/staff/guest-assistant/conversations/{publicId}/seen`

Mark as seen by staff.

## WebSocket Design

Use:

- `spring-boot-starter-websocket`
- SockJS
- STOMP

Add backend dependency:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

Add frontend dependencies:

```bash
npm install @stomp/stompjs sockjs-client
```

### Connection Model

Endpoint:

- `/ws/guest-assistant`

Topics:

- Guest private stream: `/user/queue/guest-assistant`
- Staff inbox stream: `/topic/staff/guest-assistant/inbox`
- Conversation stream: `/topic/guest-assistant/conversations/{publicId}`
- Presence stream: `/topic/staff/guest-assistant/presence`

App destinations:

- `/app/guest-assistant.send`
- `/app/guest-assistant.typing`
- `/app/guest-assistant.seen`
- `/app/guest-assistant.presence`

### JWT Auth Strategy

Recommended:

- Keep HTTP JWT auth as-is
- For STOMP connect, pass `Authorization: Bearer <token>` in connect headers
- Intercept the WebSocket handshake and populate `Principal`

### Real-Time Flow

#### Guest message

1. Guest sends message via REST or STOMP
2. Server resolves current guest and conversation
3. Server persists original text
4. Server detects language
5. Server stores translations
6. Server increments `unread_staff_count`
7. Server broadcasts:
- conversation message event
- inbox summary update
- optional notification event
8. If no online staff:
- AI fallback service generates reply
- AI message persisted
- guest receives immediate answer
- staff later see full transcript

#### Staff reply

1. Staff sends reply
2. Server persists original message
3. Server translates into guest language if needed
4. Server sets `unread_guest_count += 1`
5. Server pushes message to guest queue and staff topic
6. Guest widget updates in real time

#### Seen status

1. Guest opens panel
2. Client sends seen event
3. Server updates `seen_by_guest_at` and `unread_guest_count = 0`
4. Staff inbox list updates

## Translation Design

### Supported Languages

- `ar`
- `en`
- `fr`
- `tr`

### Service Interface

```java
public interface GuestAssistantTranslationService {
    DetectedTranslationSet translateIncoming(String text, String fallbackLanguage);
    String translateForGuest(String text, String fromLanguage, String targetLanguage);
}
```

### Persistence Strategy

Persist the original plus translation snapshots per message. Do not translate on every page load.

Why:

- Stable audit history
- Lower runtime cost
- Staff see consistent wording
- Easier analytics later

### Staff UX for Translation

For each message:

- Default collapsed original
- Tabs: `Original`, `AR`, `EN`
- Show language chip like `TR`, `FR`, `AR`, `EN`

## AI Auto Reply Design

### Important Constraint

Current `AiAssistantController` is manager-only. Do not expose that endpoint to guests directly.

### Recommended New Service

Create a guest-safe AI layer:

- `GuestAssistantAiService`
- constrained prompt
- hospitality-specific knowledge only
- no business analytics data
- no privileged reservation mutations

Example allowed intents:

- check-in and check-out times
- towel or amenity requests
- restaurant hours
- stay extension guidance
- parking, taxi, Wi-Fi, breakfast questions

Example blocked intents:

- changing payment state
- revealing other guest data
- modifying reservation without explicit backend rules

### AI Handling Rules

- If no staff online for `N` seconds, AI may respond
- AI responses must be labeled as AI
- Staff can take over at any time
- AI should never mark a conversation resolved automatically unless the thread is purely informational

Example metadata:

- `ai_generated = true`
- `ai_handled = true` on the conversation once any AI reply occurs

## Quick Actions Design

Quick actions should create both a chat message and, when appropriate, a service request.

### Action Mapping

- `ROOM_SERVICE`
  - message created
  - optional `ServiceRequest` if mapped to food/service category
- `HOUSEKEEPING`
  - message created
  - `ServiceRequest` created
- `MAINTENANCE`
  - message created
  - `ServiceRequest` created with high priority default
- `TAXI`
  - chat only, staff follow-up
- `RESTAURANT`
  - chat only or knowledge response
- `ASK_AI`
  - forces AI answer mode
- `CALL_RECEPTION`
  - chat message plus UI surface of reception number

### Reuse Existing Service Requests

For `HOUSEKEEPING`, `MAINTENANCE`, and some `ROOM_SERVICE` cases:

- call existing `ServiceRequestService`
- link the created request id in a system message
- notify staff using the existing `NotificationService`

This avoids creating two operational systems.

## Staff Inbox Design

Add a dedicated page:

- route: `/staff/guest-inbox`
- roles: `ROLE_STAFF`, `ROLE_MANAGER`

### Layout

Desktop:

- left column: conversation list
- center: message thread
- right rail: guest and reservation metadata

Mobile:

- conversation list screen
- push into detail view

### Filters

- `Active`
- `Pending`
- `Resolved`
- `AI-handled`
- `Assigned to me`
- room number
- guest name

### Metadata Panel

- guest name
- room number
- reservation confirmation number
- check-in/check-out dates
- assigned staff member
- AI handled badge
- online/offline status

## Frontend Integration Plan

### 1. Mount the floating assistant globally

Recommended mount points:

- Public shell pages: optional hidden
- Authenticated guest pages: visible
- Staff pages: hidden
- Manager pages: hidden

Best placement:

- `Layout.jsx` for guest-safe layouts
- `AppShell.jsx` for authenticated role-aware placement if needed

Rule:

- show only for `ROLE_GUEST`
- optionally show for public users later if Roomify supports pre-login chat

### 2. Add role-aware route for staff inbox

Update:

- `frontend/src/App.jsx`
- `frontend/src/components/navigation/navConfig.js`

### 3. Create conversation hooks

- `useGuestAssistantConversation`
- `useGuestAssistantSocket`
- `useStaffConversationInbox`

These should own:

- initial REST load
- optimistic send state
- STOMP subscribe lifecycle
- unread and seen handling

## UI and UX Recommendations

### Guest Widget

Use a premium hospitality look:

- deep navy, warm ivory, soft gold accents
- glass panel with soft blur
- subtle border glow when unread
- floating shadow with gentle elevation

Suggested styling direction:

- launcher: circular gradient button
- panel: rounded `28px`
- header: hotel concierge tone, not generic chatbot tone
- compact but luxurious spacing

### Motion

Reuse `framer-motion`.

Recommended animations:

- launcher pulse for unread only
- panel slide-up + fade
- message stagger on open
- typing indicator shimmer

### Guest Header

Show:

- `Guest Assistant`
- staff online status
- subtitle like `Reception and concierge support`

### Message Bubbles

- guest: brand primary background
- staff: white/glass bubble
- AI: tinted ivory bubble with `AI Assistant` badge
- system: centered pill message

### States

- minimized
- expanded
- reconnecting
- offline fallback
- no active reservation

### No Active Stay UX

If guest has no current active reservation:

- allow only informational AI questions
- disable operational quick actions
- show message: `Live room support becomes available during an active stay.`

## Example Frontend Component Skeleton

```jsx
export default function FloatingGuestAssistant() {
  const { user } = useAuth();
  const isGuest = user?.roles?.includes('ROLE_GUEST');

  if (!isGuest) return null;

  return (
    <>
      <GuestAssistantLauncher />
      <GuestAssistantPanel />
    </>
  );
}
```

## Example WebSocket Client

```js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function createGuestAssistantSocket(token) {
  return new Client({
    webSocketFactory: () => new SockJS('/ws/guest-assistant'),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
}
```

## Example Backend Messaging Controller

```java
@Controller
@RequiredArgsConstructor
public class GuestAssistantSocketController {

    private final GuestConversationRealtimeService realtimeService;

    @MessageMapping("/guest-assistant.send")
    public void send(GuestChatEnvelope envelope, Principal principal) {
        realtimeService.handleRealtimeMessage(principal, envelope);
    }
}
```

## Notification Integration

Reuse the current notification module for inbox attention, not for message transport.

Recommended behavior:

- On new guest thread:
  - create `Notification` for `Role.STAFF`
- On unresolved AI-handled thread older than threshold:
  - create escalation notification
- On maintenance quick action:
  - route to department-specific staff notification

Do not use the existing `NotificationCenter` as the message history UI.
Use it only for:

- unread alerts
- escalation notices
- resolution reminders

## Presence and Online Indicator

### Staff presence

Mark staff online when:

- staff inbox page is open
- websocket connected
- heartbeat received within threshold

Mark offline when:

- disconnect event
- heartbeat stale

### Guest widget indicator logic

- green when one or more staff are online
- amber when only AI is available
- gray when disconnected

## Security Rules

- Guest access only to their own conversation
- Staff access to all guest conversations, optionally department-filtered later
- Conversation IDs exposed as public UUIDs, not numeric ids
- WebSocket subscriptions must validate authenticated principal
- Rate-limit guest message send endpoint
- Sanitize rich text; start with plain text only

## Testing Strategy

### Backend

- repository tests for filters
- service tests for unread count logic
- service tests for AI fallback logic
- controller tests for guest authorization boundaries
- websocket integration tests for conversation broadcast

### Frontend

- widget open/close behavior
- quick action message generation
- staff inbox unread update handling
- translation tab rendering
- socket reconnect behavior

## Suggested Implementation Order In This Repo

1. Add DB migration and entities
2. Add repositories and DTOs
3. Add REST conversation APIs
4. Add guest widget with polling
5. Add staff inbox page with polling
6. Integrate quick actions with existing `ServiceRequestService`
7. Add WebSocket transport
8. Add translation abstraction
9. Add guest-safe AI fallback
10. Add sound notifications and hardening

## Final Recommended Architecture

### Guest Side

- `FloatingGuestAssistant`
- conversation state hook
- quick action renderer
- websocket subscription
- translation-aware message list

### Staff Side

- `StaffGuestInbox`
- live conversation list
- reply composer
- resolution workflow
- translation toggle

### Backend

- `GuestConversationService` for conversation lifecycle
- `GuestConversationRealtimeService` for socket events
- `GuestQuickActionService` to bridge chat and service requests
- `GuestAssistantTranslationService` for multilingual persistence
- `GuestAssistantAiService` for guest-safe fallback answers
- `GuestAssistantNotificationService` to integrate with existing Roomify notifications

### Why this fits Roomify

- Reuses existing guest, reservation, and notification data
- Preserves the current service-request flow
- Keeps AI isolated from privileged manager analytics assistant logic
- Adds real-time support without rewriting the existing app shell
- Scales from polling to fully live STOMP delivery cleanly

## Recommended Immediate Next Step

Implement Phase 1 first:

- migration
- entities
- guest conversation REST endpoints
- staff inbox REST endpoints
- guest floating widget UI
- staff inbox UI

That delivers visible product value quickly and gives a stable base before introducing WebSocket, translation, and AI fallback complexity.
