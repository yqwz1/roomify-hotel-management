package com.roomify.backend.user;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    @Query("""
        SELECT s
        FROM Staff s
        JOIN s.user u
        WHERE
            (:keyword IS NULL OR
             LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
             LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:role IS NULL OR u.role = :role)
        AND (:department IS NULL OR s.department = :department)
        AND (:active IS NULL OR s.isActive = :active)
    """)
    List<Staff> searchStaff(
            String keyword,
            Role role,
            String department,
            Boolean active
    );
}
