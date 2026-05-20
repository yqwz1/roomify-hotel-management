package com.roomify.backend.repository;

import com.roomify.backend.entity.AiPriceRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiPriceRecommendationRepository extends JpaRepository<AiPriceRecommendation, Long> {
}
