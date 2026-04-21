package com.roomify.backend.dto;

public class GuestProfileResponse {

    private String name;
    private String email;
    private String phone;
    private String idNumber;
    private String nationality;

    public GuestProfileResponse() {
    }

    public GuestProfileResponse(String name, String email, String phone, String idNumber, String nationality) {
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
