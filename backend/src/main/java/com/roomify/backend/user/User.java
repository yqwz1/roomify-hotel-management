package com.roomify.backend.user;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Set<Role> roles = new LinkedHashSet<>();

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
        setRole(role);
        this.isActive = isActive;
    }

    // Getters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public Set<Role> getRoles() {
        LinkedHashSet<Role> effectiveRoles = new LinkedHashSet<>();
        if (role != null) {
            effectiveRoles.add(role);
        }
        if (roles != null) {
            effectiveRoles.addAll(roles);
        }
        return effectiveRoles;
    }
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
        addRole(role);
    }

    public void setRoles(Collection<Role> roles) {
        this.roles.clear();
        if (roles != null) {
            roles.stream()
                    .filter(java.util.Objects::nonNull)
                    .forEach(this.roles::add);
        }
        if (role != null) {
            this.roles.add(role);
        }
    }

    public void addRole(Role role) {
        if (role != null) {
            this.roles.add(role);
        }
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
