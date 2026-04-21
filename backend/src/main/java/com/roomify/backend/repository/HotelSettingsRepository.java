package com.roomify.backend.repository;

import com.roomify.backend.entity.HotelSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelSettingsRepository extends JpaRepository<HotelSettings, Long> {

    Optional<HotelSettings> findTopByOrderByIdAsc();
}
