package com.roomify.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReservationGuestRequest {

    @NotBlank(message = "Guest name is required")
    @Size(max = 120, message = "Guest name cannot exceed 120 characters")
    private String name;

    @NotBlank(message = "Guest email is required")
    @Email(message = "Guest email format is invalid")
    @Size(max = 255, message = "Guest email cannot exceed 255 characters")
    private String email;

    @NotBlank(message = "Guest phone is required")
    @Size(max = 30, message = "Guest phone cannot exceed 30 characters")
    private String phone;

    @NotBlank(message = "Guest ID number is required")
    @Size(max = 50, message = "Guest ID number cannot exceed 50 characters")
    private String idNumber;

    @NotBlank(message = "Guest nationality is required")
    @Size(max = 100, message = "Guest nationality cannot exceed 100 characters")
    private String nationality;

    public ReservationGuestRequest() {
    }

    public ReservationGuestRequest(String name, String email, String phone, String idNumber, String nationality) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.idNumber = idNumber;
        this.nationality = nationality;
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
