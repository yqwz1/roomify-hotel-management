package com.roomify.backend.dto.ai;

import java.time.LocalDate;
import java.util.List;

public record ElasticitySimulationRequest(
        LocalDate anchorDate,
        int forecastDays,
        List<ElasticityRoomContextRequest> roomTypes) {
}
