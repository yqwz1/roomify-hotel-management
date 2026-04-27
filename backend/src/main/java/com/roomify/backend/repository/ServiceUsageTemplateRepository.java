package com.roomify.backend.repository;

import com.roomify.backend.entity.ServiceType;
import com.roomify.backend.entity.ServiceUsageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceUsageTemplateRepository extends JpaRepository<ServiceUsageTemplate, Long> {

    List<ServiceUsageTemplate> findAllByOrderByServiceTypeAscNameAsc();

    Optional<ServiceUsageTemplate> findFirstByServiceTypeAndRoomTypeIdAndActiveTrue(ServiceType serviceType, Long roomTypeId);

    Optional<ServiceUsageTemplate> findFirstByServiceTypeAndRoomTypeIsNullAndActiveTrue(ServiceType serviceType);
}
