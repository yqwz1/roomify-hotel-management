package com.roomify.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Guest entity representing hotel guests.
 * Each guest has a unique email and ID number.
 */
@Entity
@Table(name = "guests", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email", name = "uk_guest_email"),
        @UniqueConstraint(columnNames = "id_number", name = "uk_guest_id_number")
})
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Guest name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Column(length = 20)
    private String phone;

    @NotBlank(message = "ID number is required")
    @Column(name = "id_number", nullable = false, unique = true, length = 50)
    private String idNumber;

    @Size(max = 100, message = "Nationality must not exceed 100 characters")
    @Column(length = 100)
    private String nationality;

    // Constructors
    public Guest() {
    }

    public Guest(String name, String email, String phone, String idNumber, String nationality) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.idNumber = idNumber;
        this.nationality = nationality;
    }

    // Getters and Setters
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
