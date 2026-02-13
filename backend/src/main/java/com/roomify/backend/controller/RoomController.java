package com.roomify.backend.controller;

import com.roomify.backend.dto.RoomRequest;
import com.roomify.backend.dto.RoomResponse;
import com.roomify.backend.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Room management.
 * All endpoints require MANAGER role.
 */
@RestController
@RequestMapping("/api/rooms")
@PreAuthorize("hasRole('MANAGER')")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    /**
     * Create a new room.
     * POST /api/rooms
     */
    @PostMapping
    public ResponseEntity<RoomResponse> create(@Valid @RequestBody RoomRequest request) {
        RoomResponse response = roomService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all rooms.
     * GET /api/rooms
     */
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAll() {
        List<RoomResponse> rooms = roomService.findAll();
        return ResponseEntity.ok(rooms);
    }

    /**
     * Get a single room by ID.
     * GET /api/rooms/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getById(@PathVariable Long id) {
        RoomResponse response = roomService.findById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update an existing room.
     * PUT /api/rooms/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoomResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request) {
        RoomResponse response = roomService.update(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a room.
     * DELETE /api/rooms/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
