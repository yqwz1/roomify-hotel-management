package com.roomify.backend.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomify.backend.config.JacksonConfig;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GuestReservationSummaryDtoSerializationTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new JacksonConfig().objectMapper();
    }

    @Test
    void serializesCanonicalAndLegacyAliasFieldsWithSameValues() throws Exception {
        GuestReservationSummaryDto dto = new GuestReservationSummaryDto(
                "RSV-123456",
                "CONFIRMED",
                "301",
                "Deluxe",
                LocalDate.of(2026, 4, 20),
                LocalDate.of(2026, 4, 22),
                new BigDecimal("345.00"),
                "PAID",
                "INV-123456",
                true,
                new BigDecimal("345.00"),
                BigDecimal.ZERO);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsBytes(dto));

        assertEquals("RSV-123456", json.get("confirmationNumber").asText());
        assertEquals("RSV-123456", json.get("confirmation").asText());
        assertEquals("Deluxe", json.get("roomTypeName").asText());
        assertEquals("Deluxe", json.get("roomType").asText());
        assertEquals(0, new BigDecimal("345.00").compareTo(json.get("totalPrice").decimalValue()));
        assertEquals(0, new BigDecimal("345.00").compareTo(json.get("totalAmount").decimalValue()));
    }

    @Test
    void serializesLegacyAliasFieldsNullSafelyWhenCanonicalValuesAreNull() throws Exception {
        GuestReservationSummaryDto dto = new GuestReservationSummaryDto(
                null,
                "PENDING",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false,
                null,
                null);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsBytes(dto));

        assertTrue(json.has("confirmationNumber"));
        assertTrue(json.has("confirmation"));
        assertTrue(json.get("confirmationNumber").isNull());
        assertTrue(json.get("confirmation").isNull());
        assertTrue(json.has("roomTypeName"));
        assertTrue(json.has("roomType"));
        assertTrue(json.get("roomTypeName").isNull());
        assertTrue(json.get("roomType").isNull());
        assertTrue(json.has("totalPrice"));
        assertTrue(json.has("totalAmount"));
        assertTrue(json.get("totalPrice").isNull());
        assertTrue(json.get("totalAmount").isNull());
    }
}
