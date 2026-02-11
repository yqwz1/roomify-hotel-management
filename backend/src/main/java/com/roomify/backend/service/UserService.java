package com.roomify.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.Staff;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    // 1. تعريف الـ Validator الذي أنشأته أنت
    private final PasswordValidatorService passwordValidatorService;

    // 2. تحديث الـ Constructor ليقبل الـ Validator
    public UserService(UserRepository userRepository, PasswordValidatorService passwordValidatorService) {
        this.userRepository = userRepository;
        this.passwordValidatorService = passwordValidatorService;
    }

    public User createStaffUser(
            String email,
            String plainPassword, // نستخدم كلمة المرور الخام لفحصها قبل التشفير
            String name,
            String department
    ) {
        // 3. الربط الفعلي: استدعاء الفحص الخاص بك
        // إذا كانت كلمة المرور ضعيفة، سيتم رمي Exception ويتوقف التنفيذ هنا
        passwordValidatorService.validatePassword(plainPassword);

        // إذا نجح الفحص، يكمل الكود إنشاء المستخدم وحفظه
        User user = new User(email, plainPassword, Role.STAFF, true);
        Staff staff = new Staff(user, name, department);

        staff.setUser(user);
        user.setStaff(staff);

        return userRepository.save(user);
    }
}