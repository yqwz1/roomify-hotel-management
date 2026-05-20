package com.roomify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_elasticity_forecasts")
public class PriceElasticityForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "current_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "suggested_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal suggestedPrice;

    @Column(name = "price_delta_percentage", nullable = false, precision = 7, scale = 2)
    private BigDecimal priceDeltaPercentage;

    @Column(name = "expected_occupancy", nullable = false, precision = 5, scale = 2)
    private BigDecimal expectedOccupancy;

    @Column(name = "expected_bookings", nullable = false)
    private Integer expectedBookings;

    @Column(name = "expected_revenue", nullable = false, precision = 14, scale = 2)
    private BigDecimal expectedRevenue;

    @Column(name = "expected_profit", nullable = false, precision = 14, scale = 2)
    private BigDecimal expectedProfit;

    @Column(name = "confidence_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "is_recommended", nullable = false)
    private boolean recommended;

    @Column(name = "source", nullable = false, length = 40)
    private String source;

    @PrePersist
    public void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public BigDecimal getSuggestedPrice() {
        return suggestedPrice;
    }

    public void setSuggestedPrice(BigDecimal suggestedPrice) {
        this.suggestedPrice = suggestedPrice;
    }

    public BigDecimal getPriceDeltaPercentage() {
        return priceDeltaPercentage;
    }

    public void setPriceDeltaPercentage(BigDecimal priceDeltaPercentage) {
        this.priceDeltaPercentage = priceDeltaPercentage;
    }

    public BigDecimal getExpectedOccupancy() {
        return expectedOccupancy;
    }

    public void setExpectedOccupancy(BigDecimal expectedOccupancy) {
        this.expectedOccupancy = expectedOccupancy;
    }

    public Integer getExpectedBookings() {
        return expectedBookings;
    }

    public void setExpectedBookings(Integer expectedBookings) {
        this.expectedBookings = expectedBookings;
    }

    public BigDecimal getExpectedRevenue() {
        return expectedRevenue;
    }

    public void setExpectedRevenue(BigDecimal expectedRevenue) {
        this.expectedRevenue = expectedRevenue;
    }

    public BigDecimal getExpectedProfit() {
        return expectedProfit;
    }

    public void setExpectedProfit(BigDecimal expectedProfit) {
        this.expectedProfit = expectedProfit;
    }

    public BigDecimal getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(BigDecimal confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public boolean isRecommended() {
        return recommended;
    }

    public void setRecommended(boolean recommended) {
        this.recommended = recommended;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
