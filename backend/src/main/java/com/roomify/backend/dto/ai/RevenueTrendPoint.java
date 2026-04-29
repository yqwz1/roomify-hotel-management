package com.roomify.backend.dto.ai;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueTrendPoint(
        LocalDate date,
        BigDecimal revenue) {
}
