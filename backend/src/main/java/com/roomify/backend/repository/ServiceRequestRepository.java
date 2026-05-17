package com.roomify.backend.repository;

import com.roomify.backend.entity.ServiceRequest;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    @EntityGraph(attributePaths = { "guest", "room", "room.roomType" })
    List<ServiceRequest> findAllByGuest_IdInOrderByCreatedAtDesc(Collection<Long> guestIds);

    @EntityGraph(attributePaths = { "guest", "room", "room.roomType" })
    List<ServiceRequest> findAllByOrderByCreatedAtDesc();
}
