package com.roomify.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.roomify.backend.entity.HotelService;
import com.roomify.backend.repository.HotelServiceRepository;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final HotelServiceRepository repository;

    @PreAuthorize("hasAuthority('MANAGER')")
    @PostMapping
    public HotelService create(@RequestBody HotelService service) {
        return repository.save(service);
    }

    @GetMapping
    public List<HotelService> getAll() {
        return repository.findAll();
    }

    @PreAuthorize("hasAuthority('MANAGER')")
    @PutMapping("/{id}")
    public HotelService update(@PathVariable Long id, @RequestBody HotelService s) {

        HotelService existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        existing.setName(s.getName());
        existing.setCategory(s.getCategory());
        existing.setPrice(s.getPrice());
        existing.setActive(s.isActive());

        return repository.save(existing);
    }

    @PreAuthorize("hasAuthority('MANAGER')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}