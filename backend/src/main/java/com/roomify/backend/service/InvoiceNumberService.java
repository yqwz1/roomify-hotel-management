package com.roomify.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.roomify.backend.repository.InvoiceRepository;

@Service
public class InvoiceNumberService {

    private final InvoiceRepository invoiceRepository;
    private final HotelSettingsService hotelSettingsService;

    public InvoiceNumberService(
            InvoiceRepository invoiceRepository,
            HotelSettingsService hotelSettingsService) {
        this.invoiceRepository = invoiceRepository;
        this.hotelSettingsService = hotelSettingsService;
    }

    public String generate() {

        for (int i = 0; i < 10; i++) {

            String prefix = hotelSettingsService.getInvoicePrefix();
            String number =
                    prefix + "-" +
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 8)
                            .toUpperCase();

            if (!invoiceRepository.existsByInvoiceNumber(number)) {
                return number;
            }
        }

        throw new IllegalStateException("Unable to generate invoice number");
    }
}
