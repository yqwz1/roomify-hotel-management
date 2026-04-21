package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalTime;

public class HotelSettingsResponse {

    private Long id;
    private String hotelName;
    private String logoUrl;
    private String primaryColor;
    private String contactEmail;
    private String contactPhone;
    private String contactAddress;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String currencyCode;
    private BigDecimal taxRate;
    private String vatLabel;
    private String cancellationPolicy;
    private String invoiceFooter;
    private String invoicePrefix;

    public HotelSettingsResponse() {
    }

    public HotelSettingsResponse(
            Long id,
            String hotelName,
            String logoUrl,
            String primaryColor,
            String contactEmail,
            String contactPhone,
            String contactAddress,
            LocalTime checkInTime,
            LocalTime checkOutTime,
            String currencyCode,
            BigDecimal taxRate,
            String vatLabel,
            String cancellationPolicy,
            String invoiceFooter,
            String invoicePrefix) {
        this.id = id;
        this.hotelName = hotelName;
        this.logoUrl = logoUrl;
        this.primaryColor = primaryColor;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.contactAddress = contactAddress;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
        this.currencyCode = currencyCode;
        this.taxRate = taxRate;
        this.vatLabel = vatLabel;
        this.cancellationPolicy = cancellationPolicy;
        this.invoiceFooter = invoiceFooter;
        this.invoicePrefix = invoicePrefix;
    }

    public Long getId() {
        return id;
    }

    public String getHotelName() {
        return hotelName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public String getContactAddress() {
        return contactAddress;
    }

    public LocalTime getCheckInTime() {
        return checkInTime;
    }

    public LocalTime getCheckOutTime() {
        return checkOutTime;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public String getVatLabel() {
        return vatLabel;
    }

    public String getCancellationPolicy() {
        return cancellationPolicy;
    }

    public String getInvoiceFooter() {
        return invoiceFooter;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }
}
