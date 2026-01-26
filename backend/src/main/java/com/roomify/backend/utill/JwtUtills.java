package com.roomify.backend.utill;

import java.util.Date;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Component
public class JwtUtills{

    // مفتاح سري يستخدم لتشفير وفك تشفير التوكن (لا تشاركه مع أحد) 
    private final String secretKey = "SecretKey1234554321" ;

    // مدة صلاحية التوكن (هنا تم ضبطها لتكون 24 ساعة)
    private final int jwtExpirationMs = 86400000; 

    /**
     *   (Generate Token) 
     * هذه الدالة تأخذ إيميل المستخدم وصلاحيته وتحولهم لنص مشفر
     */
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email) // وضع الإيميل داخل التوكن
                .claim("role", role) // وضع الصلاحية (Manager, Staff, etc) 
                .setIssuedAt(new Date()) // وقت إصدار التوكن
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs)) // وقت انتهاء الصلاحية
                .signWith(SignatureAlgorithm.HS256, secretKey) // التوقيع باستخدام الخوارزمية والمفتاح السري
                .compact(); // بناء التوكن النهائي 
    }

    /**
     *  (Validate Token) 
     * تتأكد أن التوكن الذي أرسله المستخدم صحيح ولم ينتهي أو يتم التلاعب به
     */
    public boolean validateToken(String token) {
        try {
            // محاولة فك تشفير التوكن باستخدام المفتاح السري 
            Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);
            return true; // إذا نجح الفك يعني التوكن سليم
        } catch (Exception e) {
            // إذا حدث أي خطأ (توكن مزور أو منتهي) يرجع خطأ
            return false;
        }
    }
}