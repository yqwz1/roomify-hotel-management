package com.roomify.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomify.backend.dto.StaffCreateRequest;
import com.roomify.backend.dto.StaffResponse;
import com.roomify.backend.dto.StaffUpdateRequest;
import com.roomify.backend.security.annotation.RequireRole;
import com.roomify.backend.service.StaffService;
import com.roomify.backend.user.Role;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/staff")
@RequireRole({"MANAGER"})
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @PostMapping
    public ResponseEntity<StaffResponse> create(
            @Valid @RequestBody StaffCreateRequest request
    ) {
        StaffResponse response = staffService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //  Search + Filter endpoint
    @GetMapping
    public List<StaffResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Boolean active
    ) {
        return staffService.searchStaff(search, role, department, active);
    }

    @PutMapping("/{id}")
    public StaffResponse update(
            @PathVariable Long id,
            @Valid @RequestBody StaffUpdateRequest request
    ) {
        return staffService.updateStaff(id, request);
    }

    @PatchMapping("/{id}/activate")
    public StaffResponse activate(@PathVariable Long id) {
        return staffService.setActive(id, true);
    }

    @PatchMapping("/{id}/deactivate")
    public StaffResponse deactivate(@PathVariable Long id) {
        return staffService.setActive(id, false);
    }
}
