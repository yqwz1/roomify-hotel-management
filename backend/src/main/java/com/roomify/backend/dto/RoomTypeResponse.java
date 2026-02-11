package com.roomify.backend.dto;

import java.math.BigDecimal;

/**
 * Response DTO for RoomType entity.
 */
public class RoomTypeResponse {

    private Long id;
    private String name;
    private BigDecimal basePrice;
    private Integer maxGuests;
    private String amenities;
    private String description;

    // Constructors
    public RoomTypeResponse() {}

    public RoomTypeResponse(Long id, String name, BigDecimal basePrice, Integer maxGuests, String amenities, String description) {
        this.id = id;
        this.name = name;
        this.basePrice = basePrice;
        this.maxGuests = maxGuests;
        this.amenities = amenities;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
