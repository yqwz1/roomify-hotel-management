package com.roomify.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.roomify.backend.entity.ServiceCharge;
import com.roomify.backend.service.ServiceChargeService;

@RestController
@RequestMapping("/api/service-charges")
@RequiredArgsConstructor
public class ServiceChargeController {

    private final ServiceChargeService service;

    @PreAuthorize("hasAuthority('STAFF')")
    @GetMapping
    public List<ServiceCharge> getByReservation(@RequestParam Long reservationId) {
        return service.getByReservation(reservationId);
    }

    @PreAuthorize("hasAuthority('STAFF')")
    @PostMapping
    public ResponseEntity<?> add(
            @RequestParam Long reservationId,
            @RequestParam Long serviceId,
            @RequestParam int quantity) {

        if (quantity <= 0) {
            return ResponseEntity.badRequest().body("Quantity must be greater than 0");
        }

        try {
            return ResponseEntity.ok(
                    service.addCharge(reservationId, serviceId, quantity));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('STAFF')")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam int quantity) {

        if (quantity <= 0) {
            return ResponseEntity.badRequest().body("Quantity must be greater than 0");
        }

        try {
            return ResponseEntity.ok(
                    service.updateQuantity(id, quantity));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PreAuthorize("hasAuthority('STAFF')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        try {
            service.removeCharge(id);
            return ResponseEntity.ok("Service charge removed");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}