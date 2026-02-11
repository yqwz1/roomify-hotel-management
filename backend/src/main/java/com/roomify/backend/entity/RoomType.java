package com.roomify.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * RoomType entity representing different types of hotel rooms.
 * Each room type has a unique name and defines pricing, capacity, and available amenities.
 */
@Entity
@Table(name = "room_types", uniqueConstraints = {
    @UniqueConstraint(columnNames = "name", name = "uk_room_type_name")
})
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @NotNull(message = "Base price is required")
    @Min(value = 0, message = "Price cannot be negative")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @NotNull(message = "Max guests is required")
    @Min(value = 1, message = "Room must accommodate at least 1 guest")
    @Max(value = 8, message = "Room cannot accommodate more than 8 guests")
    @Column(nullable = false)
    private Integer maxGuests;

    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Constructors
    public RoomType() {}

    public RoomType(String name, BigDecimal basePrice, Integer maxGuests, String amenities, String description) {
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
