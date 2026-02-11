package com.roomify.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a single audit log record stored in the database.
 * Each record tracks who did what, on which target, and when.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user responsible for the action (usually email from JWT)
    @Column(nullable = true)
    private String actor;

    // The type of action performed (e.g., LOGIN, CREATE_ROOM, DELETE_BOOKING)
    @Column(nullable = false)
    private String action;

    // The object or resource affected by the action
    private String target;

    // Extra details stored as text (can be JSON format if needed)
    @Column(columnDefinition = "TEXT")
    private String metadata;

    // Time when the action happened (automatically set once)
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    public AuditLog() {
        this.timestamp = LocalDateTime.now();
    }

    public AuditLog(String actor, String action, String target, String metadata) {
        this.actor = actor;
        this.action = action;
        this.target = target;
        this.metadata = metadata;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
