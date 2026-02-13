package com.roomify.backend.service;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import org.mockito.MockitoAnnotations;

import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;

class AccountLockoutTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldLockAccountAfterFiveFailedAttempts() {
        // 1. إنشاء مستخدم تجريبي محاولاته الفاشلة = 4
        User user = new User("test@roomify.com", "HashedPass123!", Role.STAFF, true);
        user.setFailedAttempts(4);

        // 2. استدعاء الميثود للمرة الخامسة
        userService.handleFailedLogin(user);

        // 3. التحقق من النتائج
        assertEquals(5, user.getFailedAttempts(), "العداد لازم يكون 5");
        assertNotNull(user.getLockUntil(), "تاريخ القفل لازم ما يكون فاضي");
        assertTrue(user.getLockUntil().isAfter(Instant.now()), "وقت القفل لازم يكون في المستقبل");
        
        // التأكد أن النظام حاول يحفظ التغييرات في قاعدة البيانات
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void shouldResetAttemptsOnSuccess() {
        // 1. مستخدم حسابه مقفل وعنده محاولات فاشلة
        User user = new User("test@roomify.com", "HashedPass123!", Role.STAFF, true);
        user.setFailedAttempts(3);
        user.setLockUntil(Instant.now().plusSeconds(1800));

        // 2. استدعاء ميثود التصفير (عند الدخول الناجح)
        userService.resetFailedAttempts(user);

        // 3. التحقق أن كل شيء رجع لـ 0
        assertEquals(0, user.getFailedAttempts());
        assertNull(user.getLockUntil());
    }
}