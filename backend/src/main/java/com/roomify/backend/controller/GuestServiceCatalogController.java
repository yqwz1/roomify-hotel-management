package com.roomify.backend.controller;

import com.roomify.backend.entity.HotelService;
import com.roomify.backend.repository.HotelServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/guest/services")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GUEST')")
public class GuestServiceCatalogController {

    private final HotelServiceRepository hotelServiceRepository;

    @GetMapping
    public List<HotelService> getActiveServices() {
        return hotelServiceRepository.findAll().stream()
                .filter(HotelService::isActive)
                .sorted(Comparator.comparing(
                        service -> service.getName() == null ? "" : service.getName(),
                        String.CASE_INSENSITIVE_ORDER
                ))
                .toList();
    }
}
