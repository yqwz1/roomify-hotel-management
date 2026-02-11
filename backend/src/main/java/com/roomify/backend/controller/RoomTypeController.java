package com.roomify.backend.controller;

import com.roomify.backend.dto.RoomTypeRequest;
import com.roomify.backend.dto.RoomTypeResponse;
import com.roomify.backend.service.RoomTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room-types")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    public RoomTypeController(RoomTypeService roomTypeService) {
        this.roomTypeService = roomTypeService;
    }

    /**
     * Create a new room type.
     * POST /api/room-types
     */
    @PostMapping
    public ResponseEntity<RoomTypeResponse> create(@Valid @RequestBody RoomTypeRequest request) {
        RoomTypeResponse response = roomTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all room types.
     * GET /api/room-types
     */
    @GetMapping
    public ResponseEntity<List<RoomTypeResponse>> getAll() {
        List<RoomTypeResponse> roomTypes = roomTypeService.findAll();
        return ResponseEntity.ok(roomTypes);
    }

    /**
     * Get a single room type by ID.
     * GET /api/room-types/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoomTypeResponse> getById(@PathVariable Long id) {
        RoomTypeResponse response = roomTypeService.findById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update an existing room type.
     * PUT /api/room-types/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoomTypeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RoomTypeRequest request) {
        RoomTypeResponse response = roomTypeService.update(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a room type.
     * DELETE /api/room-types/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
