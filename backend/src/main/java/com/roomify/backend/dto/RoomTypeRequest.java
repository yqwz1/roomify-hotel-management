package com.roomify.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Request DTO for creating or updating a RoomType.
 */
public class RoomTypeRequest {

    @NotBlank(message = "Room type name is required")
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    private String name;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Price must be at least 0.01")
    private BigDecimal basePrice;

    @NotNull(message = "Max guests is required")
    @Min(value = 1, message = "Room must accommodate at least 1 guest")
    @Max(value = 8, message = "Room cannot accommodate more than 8 guests")
    private Integer maxGuests;

    private String amenities;

    private String description;

    // Constructors
    public RoomTypeRequest() {}

    public RoomTypeRequest(String name, BigDecimal basePrice, Integer maxGuests, String amenities, String description) {
        this.name = name;
        this.basePrice = basePrice;
        this.maxGuests = maxGuests;
        this.amenities = amenities;
        this.description = description;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public Integer getMaxGuests() {
        return maxGuests;
    }

    public void setMaxGuests(Integer maxGuests) {
        this.maxGuests = maxGuests;
    }

    public String getAmenities() {
        return amenities;
    }

    public void setAmenities(String amenities) {
        this.amenities = amenities;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
