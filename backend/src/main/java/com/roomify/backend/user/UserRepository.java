package com.roomify.backend.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // 1. البحث عن المستخدمين النشطين فقط (مفيد في عملية تسجيل الدخول)
    Optional<User> findByEmailAndIsActiveTrue(String email);

    // 2. البحث عن المستخدمين بناءً على دورهم (Admin/User)
    List<User> findByRole(Role role);
}