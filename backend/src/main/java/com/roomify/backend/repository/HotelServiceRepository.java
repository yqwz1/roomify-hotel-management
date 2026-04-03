package com.roomify.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.roomify.backend.entity.HotelService;

public interface HotelServiceRepository extends JpaRepository<HotelService, Long> {
}