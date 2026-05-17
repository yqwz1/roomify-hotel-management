package com.roomify.backend.controller;

import com.roomify.backend.dto.ServiceRequestCreateRequest;
import com.roomify.backend.dto.ServiceRequestResponse;
import com.roomify.backend.service.ServiceRequestService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guest/service-requests")
@PreAuthorize("hasRole('GUEST')")
@RequiredArgsConstructor
public class GuestServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    @GetMapping
    public ResponseEntity<List<ServiceRequestResponse>> list() {
        return ResponseEntity.ok(serviceRequestService.listForCurrentGuest());
    }

    @PostMapping
    public ResponseEntity<ServiceRequestResponse> create(
            @Valid @RequestBody ServiceRequestCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceRequestService.createForCurrentGuest(request));
    }
}
