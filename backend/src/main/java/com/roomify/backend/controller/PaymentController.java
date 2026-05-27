package com.roomify.backend.controller;

import com.roomify.backend.dto.MockRefundRequest;
import com.roomify.backend.dto.PaymentRequest;
import com.roomify.backend.dto.PaymentResponse;
import com.roomify.backend.entity.PaymentStatus;
import com.roomify.backend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<PaymentResponse>> listPayments(
            @RequestParam(required = false) PaymentStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(paymentService.listPayments(status, authentication.getName(), true));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN') or hasRole('GUEST')")
    public ResponseEntity<PaymentResponse> getPayment(
            @PathVariable Long paymentId,
            Authentication authentication) {
        boolean privileged = hasPrivilegedRole(authentication);
        return ResponseEntity.ok(paymentService.getPayment(paymentId, authentication.getName(), privileged));
    }

    @GetMapping("/by-reservation/{reservationId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN') or hasRole('GUEST')")
    public ResponseEntity<PaymentResponse> getPaymentByReservation(
            @PathVariable Long reservationId,
            Authentication authentication) {
        boolean privileged = hasPrivilegedRole(authentication);
        return ResponseEntity.ok(paymentService.getLatestForReservation(reservationId, authentication.getName(), privileged));
    }

    @GetMapping("/receipt/{paymentId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN') or hasRole('GUEST')")
    public ResponseEntity<PaymentResponse> getReceipt(
            @PathVariable Long paymentId,
            Authentication authentication) {
        boolean privileged = hasPrivilegedRole(authentication);
        return ResponseEntity.ok(paymentService.getPayment(paymentId, authentication.getName(), privileged));
    }

    @PostMapping("/mock/{paymentId}/refund")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponse> refundPayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody(required = false) MockRefundRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(paymentService.refundPayment(paymentId, request, authentication.getName()));
    }

    private boolean hasPrivilegedRole(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> {
                    String role = authority.getAuthority();
                    return "ROLE_MANAGER".equals(role) || "ROLE_STAFF".equals(role) || "ROLE_ADMIN".equals(role);
                });
    }
}
