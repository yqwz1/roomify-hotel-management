package com.roomify.backend.repository;

import com.roomify.backend.entity.ServiceUsageTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceUsageTemplateItemRepository extends JpaRepository<ServiceUsageTemplateItem, Long> {
}
