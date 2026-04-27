package com.roomify.backend.repository;

import com.roomify.backend.entity.ServiceUsageRecordItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceUsageRecordItemRepository extends JpaRepository<ServiceUsageRecordItem, Long> {
}
