package com.roomify.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalTime;

public class HotelSettingsRequest {

    @NotBlank(message = "Hotel name is required")
    @Size(max = 150, message = "Hotel name cannot exceed 150 characters")
    private String hotelName;

    @Size(max = 1000, message = "Logo URL cannot exceed 1000 characters")
    private String logoUrl;

    @Size(max = 20, message = "Primary color cannot exceed 20 characters")
    private String primaryColor;

    @Size(max = 255, message = "Contact email cannot exceed 255 characters")
    private String contactEmail;

    @Size(max = 50, message = "Contact phone cannot exceed 50 characters")
    private String contactPhone;

    private String contactAddress;

    private LocalTime checkInTime;

    private LocalTime checkOutTime;

    @Size(max = 12, message = "Currency code cannot exceed 12 characters")
    private String currencyCode;

    @DecimalMin(value = "0.0", inclusive = true, message = "Tax rate must be positive")
    private BigDecimal taxRate;

    @Size(max = 50, message = "VAT label cannot exceed 50 characters")
    private String vatLabel;

    private String cancellationPolicy;

    private String invoiceFooter;

    @Size(max = 20, message = "Invoice prefix cannot exceed 20 characters")
    private String invoicePrefix;

    public String getHotelName() {
        return hotelName;
    }

    public void setHotelName(String hotelName) {
        this.hotelName = hotelName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactAddress() {
        return contactAddress;
    }

    public void setContactAddress(String contactAddress) {
        this.contactAddress = contactAddress;
    }

    public LocalTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public LocalTime getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(LocalTime checkOutTime) {
        this.checkOutTime = checkOutTime;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public String getVatLabel() {
        return vatLabel;
    }

    public void setVatLabel(String vatLabel) {
        this.vatLabel = vatLabel;
    }

    public String getCancellationPolicy() {
        return cancellationPolicy;
    }

    public void setCancellationPolicy(String cancellationPolicy) {
        this.cancellationPolicy = cancellationPolicy;
    }

    public String getInvoiceFooter() {
        return invoiceFooter;
    }

    public void setInvoiceFooter(String invoiceFooter) {
        this.invoiceFooter = invoiceFooter;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public void setInvoicePrefix(String invoicePrefix) {
        this.invoicePrefix = invoicePrefix;
    }
}
