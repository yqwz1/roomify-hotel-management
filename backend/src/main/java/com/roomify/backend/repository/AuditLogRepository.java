package com.roomify.backend.repository;

import com.roomify.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository responsible for database operations related to audit logs.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
