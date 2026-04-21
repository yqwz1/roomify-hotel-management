package com.roomify.backend.controller;

import com.roomify.backend.dto.InvoiceDetailsDto;
import com.roomify.backend.dto.InvoiceListItemDto;
import com.roomify.backend.service.InvoiceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guest/invoices")
@PreAuthorize("hasRole('GUEST')")
@RequiredArgsConstructor
public class GuestInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceListItemDto>> getGuestInvoices() {
        return ResponseEntity.ok(invoiceService.getGuestInvoiceHistory());
    }

    @GetMapping("/{confirmationNumber}")
    public ResponseEntity<InvoiceDetailsDto> getGuestInvoiceDetails(
            @PathVariable String confirmationNumber) {
        return ResponseEntity.ok(invoiceService.getGuestInvoiceDetails(confirmationNumber));
    }

    @GetMapping("/{confirmationNumber}/pdf")
    public ResponseEntity<byte[]> getGuestInvoicePdf(
            @PathVariable String confirmationNumber) {
        byte[] pdf = invoiceService.getGuestInvoicePdf(confirmationNumber);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }
}
