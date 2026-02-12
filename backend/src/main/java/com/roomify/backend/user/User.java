package com.roomify.backend.user;

import java.time.Instant;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

// Number of failed login attempts
// Used to lock the account after multiple failures
@Column(name = "failed_attempts", nullable = false)
   private int failedAttempts = 0;

   // Timestamp until which the account is locked
    @Column(name = "lock_until")
    private Instant lockUntil;

    // Link to staff profile data
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Staff staff;


    // Constructors
    protected User() {}

    public User(String email, String passwordHash, Role role, boolean isActive) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.isActive = isActive;
    }

    // Getters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public boolean isActive() { return isActive; }
    public Staff getStaff() { return staff; }

    // Setters 
    public void setEmail(String email) {
        this.email = email;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
public void setStaff(Staff staff) {
    this.staff = staff;
}

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public Instant getLockUntil() {
        return lockUntil;
    }

    public void setLockUntil(Instant lockUntil) {
        this.lockUntil = lockUntil;
    }
}
