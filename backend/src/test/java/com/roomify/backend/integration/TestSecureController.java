package com.roomify.backend.integration;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
class TestSecureController {

    @GetMapping("/manager/summary")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'MANAGER'})")
    ResponseEntity<String> managerSummary() {
        return ResponseEntity.ok("manager-summary");
    }

    @GetMapping("/manager/reports")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'MANAGER'})")
    ResponseEntity<String> managerReports() {
        return ResponseEntity.ok("manager-reports");
    }

    @GetMapping("/staff/summary")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'STAFF'})")
    ResponseEntity<String> staffSummary() {
        return ResponseEntity.ok("staff-summary");
    }

    @GetMapping("/staff/schedule")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'STAFF'})")
    ResponseEntity<String> staffSchedule() {
        return ResponseEntity.ok("staff-schedule");
    }

    @GetMapping("/guest/summary")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'GUEST'})")
    ResponseEntity<String> guestSummary() {
        return ResponseEntity.ok("guest-summary");
    }

    @GetMapping("/guest/profile")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'GUEST'})")
    ResponseEntity<String> guestProfile() {
        return ResponseEntity.ok("guest-profile");
    }

    @GetMapping("/shared/frontdesk")
    @PreAuthorize("@roleSecurityEvaluator.hasAnyRole({'MANAGER','STAFF'})")
    ResponseEntity<String> sharedFrontdesk() {
        return ResponseEntity.ok("shared-frontdesk");
    }
}
