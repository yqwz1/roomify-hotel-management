package com.roomify.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;

/**
 * Optional parameters for live bill recalculation.
 */
public class BillingRequest {

    @DecimalMin(value = "0.0", inclusive = true, message = "Service charges cannot be negative")
    private BigDecimal serviceCharges = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Discount amount cannot be negative")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    public BillingRequest() {
    }

    public BillingRequest(BigDecimal serviceCharges, BigDecimal discountAmount) {
        this.serviceCharges = serviceCharges != null ? serviceCharges : BigDecimal.ZERO;
        this.discountAmount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
    }

    public BigDecimal getServiceCharges() {
        return serviceCharges;
    }

    public void setServiceCharges(BigDecimal serviceCharges) {
        this.serviceCharges = serviceCharges != null ? serviceCharges : BigDecimal.ZERO;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
    }
}
