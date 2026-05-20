package com.roomify.backend.repository;

import com.roomify.backend.entity.PriceElasticityForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PriceElasticityForecastRepository extends JpaRepository<PriceElasticityForecast, Long> {
}
