package com.roomify.backend.dto;

import java.util.List; // لازم نسوي استيراد عشان نقدر نستخدم القوائم

public class JwtResponse {

    private String token; // هذا التوكن المشفر اللي بيستخدمه إياد في كل الطلبات الجاية
    private String type = "Bearer"; // نوع التوكن (ستاندرد عالمي)
    private Long id; // رقم المستخدم في الداتا بيس
    private String username; // اسم المستخدم
    private String email; // الإيميل
    private List<String> roles; // قائمة الصلاحيات (مثلاً: ["ROLE_MANAGER", "ROLE_ADMIN"])

    // 1. كونستركتور (نستخدمه عشان نعبي البيانات بسرعة لما نرد على الفرونت)
    public JwtResponse(String accessToken, Long id, String username, String email, List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    // 2. Getters and Setters
    // (الفرونت يحتاج يقرأ هذي البيانات عشان يعرض الاسم ويخزن التوكن)

    public String getToken() {
        return token;
    }

    public void setToken(String accessToken) {
        this.token = accessToken;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getRoles() {
        return roles;
    }

    // هنا نقدر نستخدم التيست عشان نتأكد ان الليست مو فاضية لو حبينا مستقبلاً
    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}