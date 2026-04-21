package com.roomify.backend.controller;

import com.roomify.backend.dto.InvoiceDetailsDto;
import com.roomify.backend.dto.InvoiceListItemDto;
import com.roomify.backend.entity.InvoiceDeliveryLog;
import com.roomify.backend.service.InvoiceService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceListItemDto>> getInvoiceHistory() {
        return ResponseEntity.ok(invoiceService.getInvoiceHistory());
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<InvoiceDetailsDto> getInvoiceDetails(
            @PathVariable Long reservationId) {
        return ResponseEntity.ok(invoiceService.getInvoiceDetails(reservationId));
    }

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

    @GetMapping("/{reservationId}/delivery-status")
    public ResponseEntity<Map<String, Object>> getInvoiceDeliveryStatus(
            @PathVariable Long reservationId) {

        Optional<InvoiceDeliveryLog> latestLog = invoiceService.getLatestDeliveryStatus(reservationId);

        if (latestLog.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("status", "UNKNOWN");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }

        InvoiceDeliveryLog log = latestLog.get();

        Map<String, Object> body = new HashMap<>();
        body.put("status", log.getStatus().name());
        body.put("errorMessage", log.getErrorMessage());
        body.put("sentAt", log.getCreatedAt());

        return ResponseEntity.ok(body);
    }

    @PostMapping("/{reservationId}/email")
    public ResponseEntity<Map<String, Object>> sendInvoiceEmail(
            @PathVariable Long reservationId) {

        Optional<InvoiceDeliveryLog> latestLog = invoiceService.sendInvoiceEmailForReservation(reservationId);

        if (latestLog.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("status", "UNKNOWN");
            return ResponseEntity.ok(body);
        }

        InvoiceDeliveryLog log = latestLog.get();

        Map<String, Object> body = new HashMap<>();
        body.put("status", log.getStatus().name());
        body.put("errorMessage", log.getErrorMessage());
        body.put("sentAt", log.getCreatedAt());

        return ResponseEntity.ok(body);
    }
}
