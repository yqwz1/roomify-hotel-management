package com.roomify.backend.repository;

import com.roomify.backend.entity.ServiceUsageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceUsageRecordRepository extends JpaRepository<ServiceUsageRecord, Long> {

    List<ServiceUsageRecord> findTop20ByOrderByPerformedAtDescIdDesc();

    List<ServiceUsageRecord> findByServiceDateBetweenOrderByPerformedAtDescIdDesc(LocalDate start, LocalDate end);
}
