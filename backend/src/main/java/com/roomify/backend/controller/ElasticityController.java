package com.roomify.backend.controller;

import com.roomify.backend.dto.ai.ElasticityForecastResponse;
import com.roomify.backend.service.ElasticityService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-finance/elasticity")
@PreAuthorize("hasRole('MANAGER')")
public class ElasticityController {

    private final ElasticityService elasticityService;

    public ElasticityController(ElasticityService elasticityService) {
        this.elasticityService = elasticityService;
    }

    @GetMapping
    public ResponseEntity<List<ElasticityForecastResponse>> getElasticityForecasts() {
        return ResponseEntity.ok(elasticityService.getElasticityForecasts());
    }

    @GetMapping("/{roomTypeId}")
    public ResponseEntity<ElasticityForecastResponse> getElasticityForecast(
            @PathVariable Long roomTypeId) {
        return ResponseEntity.ok(elasticityService.getElasticityForecastForRoomType(roomTypeId));
    }
}
