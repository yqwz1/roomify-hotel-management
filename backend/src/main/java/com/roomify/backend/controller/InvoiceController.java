package com.roomify.backend.controller;

import com.roomify.backend.service.InvoiceService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/{reservationId}")
    public ResponseEntity<String> generateInvoice(
            @PathVariable Long reservationId) {

        invoiceService.generateInvoice(reservationId);

        return ResponseEntity.ok("Invoice generated successfully");
    }

    @GetMapping("/pdf/{reservationId}")
    public ResponseEntity<byte[]> getInvoicePdf(
            @PathVariable Long reservationId) {

        byte[] pdf = invoiceService.getInvoicePdf(reservationId);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }
}