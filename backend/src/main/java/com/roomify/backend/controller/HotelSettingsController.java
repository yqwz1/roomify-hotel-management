package com.roomify.backend.controller;

import com.roomify.backend.dto.HotelSettingsRequest;
import com.roomify.backend.dto.HotelSettingsResponse;
import com.roomify.backend.service.HotelSettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hotel-settings")
public class HotelSettingsController {

    private final HotelSettingsService hotelSettingsService;

    public HotelSettingsController(HotelSettingsService hotelSettingsService) {
        this.hotelSettingsService = hotelSettingsService;
    }

    @GetMapping
    public ResponseEntity<HotelSettingsResponse> getSettings() {
        return ResponseEntity.ok(hotelSettingsService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<HotelSettingsResponse> updateSettings(
            @Valid @RequestBody HotelSettingsRequest request) {
        return ResponseEntity.ok(hotelSettingsService.updateSettings(request));
    }
}
