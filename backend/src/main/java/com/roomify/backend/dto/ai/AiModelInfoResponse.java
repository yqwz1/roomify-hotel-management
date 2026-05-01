package com.roomify.backend.dto.ai;

import java.util.List;

public record AiModelInfoResponse(
        String modelType,
        String trainedAt,
        long trainingRows,
        Double revenueMae,
        Double occupancyMae,
        List<String> features,
        List<String> targets) {
}
