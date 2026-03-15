package com.roomify.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.roomify.backend.repository.InvoiceRepository;

@Service
public class InvoiceNumberService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceNumberService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public String generate() {

        for (int i = 0; i < 10; i++) {

            String number =
                    "INV-" +
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