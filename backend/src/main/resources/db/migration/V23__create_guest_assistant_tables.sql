create table guest_conversations (
    id bigserial primary key,
    public_id uuid not null unique,
    guest_id bigint not null references guests(id),
    reservation_id bigint references reservations(id),
    room_id bigint references rooms(id),
    service_request_id bigint references service_requests(id),
    assigned_staff_user_id bigint references users(id),
    status varchar(20) not null,
    subject varchar(160),
    preferred_language varchar(10) not null default 'en',
    ai_fallback_enabled boolean not null default true,
    ai_handled boolean not null default false,
    unread_guest_count integer not null default 0,
    unread_staff_count integer not null default 0,
    last_message_preview varchar(280),
    last_message_at timestamp not null default now(),
    resolved_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index idx_guest_conversations_guest_id
    on guest_conversations(guest_id);

create index idx_guest_conversations_status_last_message
    on guest_conversations(status, last_message_at desc);

create index idx_guest_conversations_last_message_at
    on guest_conversations(last_message_at desc);

create index idx_guest_conversations_room_id
    on guest_conversations(room_id);

create index idx_guest_conversations_reservation_id
    on guest_conversations(reservation_id);

create table guest_conversation_messages (
    id bigserial primary key,
    conversation_id bigint not null references guest_conversations(id) on delete cascade,
    sender_role varchar(20) not null,
    sender_user_id bigint references users(id),
    sender_guest_id bigint references guests(id),
    service_request_id bigint references service_requests(id),
    message_status varchar(20) not null,
    original_body text not null,
    detected_language varchar(10) not null,
    arabic_translation text,
    english_translation text,
    guest_localized_body text,
    guest_localized_language varchar(10),
    ai_generated boolean not null default false,
    quick_action_type varchar(40),
    delivered_at timestamp,
    read_by_guest_at timestamp,
    read_by_staff_at timestamp,
    created_at timestamp not null default now()
);

create index idx_guest_conversation_messages_conversation_created
    on guest_conversation_messages(conversation_id, created_at);

create index idx_guest_conversation_messages_sender_role
    on guest_conversation_messages(sender_role);

create index idx_guest_conversation_messages_status
    on guest_conversation_messages(message_status);
