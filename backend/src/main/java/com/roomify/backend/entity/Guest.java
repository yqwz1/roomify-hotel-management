package com.roomify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Guest entity representing hotel guests.
 */
@Entity
@Table(name = "guests", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email", name = "uk_guest_email")
})
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Guest name is required")
    @Size(max = 120, message = "Guest name cannot exceed 120 characters")
    @Column(nullable = false, length = 120)
    private String name;

    @NotBlank(message = "Guest email is required")
    @Email(message = "Guest email format is invalid")
    @Size(max = 255, message = "Guest email cannot exceed 255 characters")
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @NotBlank(message = "Guest phone is required")
    @Size(max = 30, message = "Guest phone cannot exceed 30 characters")
    @Column(nullable = false, length = 30)
    private String phone;

    @NotBlank(message = "Guest ID number is required")
    @Size(max = 50, message = "Guest ID number cannot exceed 50 characters")
    @Column(name = "id_number", nullable = false, length = 50)
    private String idNumber;

    @NotBlank(message = "Guest nationality is required")
    @Size(max = 100, message = "Guest nationality cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String nationality;

    public Guest() {
    }

    public Guest(String name, String email, String phone, String idNumber, String nationality) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.idNumber = idNumber;
        this.nationality = nationality;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }
}
