package com.roomify.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.roomify.backend.entity.ServiceCharge;

import java.util.List;

public interface ServiceChargeRepository extends JpaRepository<ServiceCharge, Long> {

    List<ServiceCharge> findByReservationId(Long reservationId);
}