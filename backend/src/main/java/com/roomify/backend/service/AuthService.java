package com.roomify.backend.service;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // تأكد من المسار عند Dev 2
import org.springframework.stereotype.Service;

import com.roomify.backend.config.JwtUtils;
import com.roomify.backend.dto.JwtResponse;
import com.roomify.backend.dto.LoginRequest;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils; // الأداة اللي سواها Dev 2

    public JwtResponse login(LoginRequest loginRequest) {
        
        // 1. البحث عن المستخدم (من الـ Repository اللي فيه findByEmail)
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new BadCredentialsException("الإيميل أو كلمة المرور غير صحيحة"));

        // 2. التحقق من حالة الحساب (حسب تاسك Dev 3 - Account Locked logic)
        if (!user.isActive()) {
            throw new RuntimeException("هذا الحساب معطل، يرجى التواصل مع الإدارة");
        }

        // 3. مطابقة كلمة المرور المشفرة (باستخدام الـ Bean اللي عرفته في الـ Config)
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("الإيميل أو كلمة المرور غير صحيحة");
        }

        // 4. طلب توليد التوكن من Dev 2
        // نمرر الإيميل والدور كـ Strings كما هو معرف في JwtUtils
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        // 5. تجهيز الرد
        List<String> roles = Collections.singletonList("ROLE_" + user.getRole().name());

        // 6. إرجاع الرد النهائي بناءً على الـ Constructor اللي في JwtResponse
        return new JwtResponse(
                token,
                user.getId(),
                user.getEmail(), // أو username إذا كان موجود
                user.getEmail(),
                roles
        );
    }
}