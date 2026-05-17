package com.roomify.backend.controller;

import com.roomify.backend.dto.ServiceRequestResponse;
import com.roomify.backend.dto.ServiceRequestStatusUpdateRequest;
import com.roomify.backend.service.ServiceRequestService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/service-requests")
@PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
@RequiredArgsConstructor
public class StaffServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    @GetMapping
    public ResponseEntity<List<ServiceRequestResponse>> list() {
        return ResponseEntity.ok(serviceRequestService.listForStaff());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ServiceRequestResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequestStatusUpdateRequest request) {
        return ResponseEntity.ok(serviceRequestService.updateStatus(id, request.getStatus()));
    }
}
