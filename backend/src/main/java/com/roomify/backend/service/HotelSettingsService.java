package com.roomify.backend.service;

import com.roomify.backend.dto.HotelSettingsRequest;
import com.roomify.backend.dto.HotelSettingsResponse;
import com.roomify.backend.entity.HotelSettings;
import com.roomify.backend.repository.HotelSettingsRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HotelSettingsService {

    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("0.15");

    private final HotelSettingsRepository hotelSettingsRepository;

    public HotelSettingsService(HotelSettingsRepository hotelSettingsRepository) {
        this.hotelSettingsRepository = hotelSettingsRepository;
    }

    @Transactional(readOnly = true)
    public HotelSettingsResponse getSettings() {
        return toResponse(resolveSettings());
    }

    public HotelSettingsResponse updateSettings(HotelSettingsRequest request) {
        HotelSettings settings = resolveSettings();

        settings.setHotelName(trimToNull(request.getHotelName(), "Roomify Hotel"));
        settings.setLogoUrl(trimToNull(request.getLogoUrl(), null));
        settings.setPrimaryColor(trimToNull(request.getPrimaryColor(), "#18181b"));
        settings.setContactEmail(trimToNull(request.getContactEmail(), "info@roomify.com"));
        settings.setContactPhone(trimToNull(request.getContactPhone(), "+966 555 555 555"));
        settings.setContactAddress(trimToNull(request.getContactAddress(), "Riyadh, Saudi Arabia"));
        settings.setCheckInTime(request.getCheckInTime() != null ? request.getCheckInTime() : LocalTime.of(15, 0));
        settings.setCheckOutTime(request.getCheckOutTime() != null ? request.getCheckOutTime() : LocalTime.of(12, 0));
        settings.setCurrencyCode(trimToNull(request.getCurrencyCode(), "SAR"));
        settings.setTaxRate(sanitizeTaxRate(request.getTaxRate()));
        settings.setVatLabel(trimToNull(request.getVatLabel(), "VAT"));
        settings.setCancellationPolicy(trimToNull(
                request.getCancellationPolicy(),
                "Free cancellation up to 24 hours before check-in."));
        settings.setInvoiceFooter(trimToNull(
                request.getInvoiceFooter(),
                "Thank you for staying with us."));
        settings.setInvoicePrefix(trimToNull(request.getInvoicePrefix(), "INV"));

        HotelSettings saved = hotelSettingsRepository.save(settings);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTaxRate() {
        return sanitizeTaxRate(resolveSettings().getTaxRate());
    }

    @Transactional(readOnly = true)
    public String getInvoicePrefix() {
        return trimToNull(resolveSettings().getInvoicePrefix(), "INV");
    }

    @Transactional(readOnly = true)
    public HotelSettings resolveSettings() {
        return hotelSettingsRepository.findTopByOrderByIdAsc().orElseGet(this::buildDefaultSettings);
    }

    private HotelSettings buildDefaultSettings() {
        HotelSettings settings = new HotelSettings();
        settings.setHotelName("Roomify Hotel");
        settings.setLogoUrl(null);
        settings.setPrimaryColor("#18181b");
        settings.setContactEmail("info@roomify.com");
        settings.setContactPhone("+966 555 555 555");
        settings.setContactAddress("Riyadh, Saudi Arabia");
        settings.setCheckInTime(LocalTime.of(15, 0));
        settings.setCheckOutTime(LocalTime.of(12, 0));
        settings.setCurrencyCode("SAR");
        settings.setTaxRate(DEFAULT_TAX_RATE);
        settings.setVatLabel("VAT");
        settings.setCancellationPolicy("Free cancellation up to 24 hours before check-in.");
        settings.setInvoiceFooter("Thank you for staying with us.");
        settings.setInvoicePrefix("INV");
        return settings;
    }

    private HotelSettingsResponse toResponse(HotelSettings settings) {
        return new HotelSettingsResponse(
                settings.getId(),
                settings.getHotelName(),
                settings.getLogoUrl(),
                settings.getPrimaryColor(),
                settings.getContactEmail(),
                settings.getContactPhone(),
                settings.getContactAddress(),
                settings.getCheckInTime(),
                settings.getCheckOutTime(),
                settings.getCurrencyCode(),
                sanitizeTaxRate(settings.getTaxRate()),
                settings.getVatLabel(),
                settings.getCancellationPolicy(),
                settings.getInvoiceFooter(),
                settings.getInvoicePrefix());
    }

    private String trimToNull(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private BigDecimal sanitizeTaxRate(BigDecimal taxRate) {
        if (taxRate == null || taxRate.compareTo(BigDecimal.ZERO) < 0) {
            return DEFAULT_TAX_RATE;
        }
        return taxRate.setScale(4, RoundingMode.HALF_UP);
    }
}
