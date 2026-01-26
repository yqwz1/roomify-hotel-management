package com.roomify.backend.dto;

// استيراد مكتبات التحقق (Validation)
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    //   استخدمته النوتيشن لمجرد الاضافة
    // */ 1. @NotBlank: تمنع أن الحقل يكون فاضي أو مسافة
    // */ 2. @Email: تتأكد أن الصيغة إيميل صحيح (فيه @ ونقطة)
    @NotBlank(message = "Email is required") 
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    // --- بقية الكود (Constructors & Getters/Setters) زي ما هو ---
    
    public LoginRequest() {
    }

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}