package com.roomify.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String target;

    @Column(length = 1000)
    private String metadata;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public AuditLog(String actor, String action, String target, String metadata) {
        this.actor = actor;
        this.action = action;
        this.target = target;
        this.metadata = metadata;
    }

    public Long getId() {
        return id;
    }

    public String getActor() {
        return actor;
    }

    public String getAction() {
        return action;
    }

    public String getTarget() {
        return target;
    }

    public String getMetadata() {
        return metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}