package com.roomify.backend.dto;

import java.math.BigDecimal;

public class PricingBreakdownDto {

    private long nights;
    private BigDecimal pricePerNight;
    private BigDecimal subtotal;
    private BigDecimal seasonalAdjustment;
    private BigDecimal discountAmount;
    private BigDecimal vatRate;
    private BigDecimal vatAmount;
    private BigDecimal total;
    private String pricingModel;
    private String promoCode;

    public PricingBreakdownDto() {
    }

    public PricingBreakdownDto(
            long nights,
            BigDecimal pricePerNight,
            BigDecimal subtotal,
            BigDecimal seasonalAdjustment,
            BigDecimal discountAmount,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal total,
            String pricingModel,
            String promoCode) {
        this.nights = nights;
        this.pricePerNight = pricePerNight;
        this.subtotal = subtotal;
        this.seasonalAdjustment = seasonalAdjustment;
        this.discountAmount = discountAmount;
        this.vatRate = vatRate;
        this.vatAmount = vatAmount;
        this.total = total;
        this.pricingModel = pricingModel;
        this.promoCode = promoCode;
    }

    public long getNights() {
        return nights;
    }

    public void setNights(long nights) {
        this.nights = nights;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getSeasonalAdjustment() {
        return seasonalAdjustment;
    }

    public void setSeasonalAdjustment(BigDecimal seasonalAdjustment) {
        this.seasonalAdjustment = seasonalAdjustment;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getVatRate() {
        return vatRate;
    }

    public void setVatRate(BigDecimal vatRate) {
        this.vatRate = vatRate;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getPricingModel() {
        return pricingModel;
    }

    public void setPricingModel(String pricingModel) {
        this.pricingModel = pricingModel;
    }

    public String getPromoCode() {
        return promoCode;
    }

    public void setPromoCode(String promoCode) {
        this.promoCode = promoCode;
    }
}
