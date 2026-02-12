package com.roomify.backend.service;

import com.roomify.backend.dto.RoomRequest;
import com.roomify.backend.dto.RoomResponse;
import com.roomify.backend.dto.RoomTypeResponse;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.DuplicateResourceException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    public RoomService(RoomRepository roomRepository, RoomTypeRepository roomTypeRepository) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    /**
     * Create a new room.
     */
    public RoomResponse create(RoomRequest request) {
        // Check if room number already exists
        if (roomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new DuplicateResourceException("Room with number '" + request.getRoomNumber() + "' already exists");
        }

        // Verify room type exists
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + request.getRoomTypeId()));

        // Create entity from DTO
        Room room = new Room(
                request.getRoomNumber(),
                roomType,
                request.getFloor(),
                request.getStatus()
        );

        // Save to repository
        Room saved = roomRepository.save(room);

        // Return response DTO
        return toResponse(saved);
    }

    /**
     * Get all rooms.
     */
    public List<RoomResponse> findAll() {
        return roomRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get room by ID.
     */
    public RoomResponse findById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
        return toResponse(room);
    }

    /**
     * Update an existing room.
     */
    public RoomResponse update(Long id, RoomRequest request) {
        // Find existing room
        Room existing = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));

        // Check if new room number conflicts with another room
        if (!existing.getRoomNumber().equals(request.getRoomNumber()) && 
            roomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new DuplicateResourceException("Room with number '" + request.getRoomNumber() + "' already exists");
        }

        // Verify room type exists if changed
        if (!existing.getRoomType().getId().equals(request.getRoomTypeId())) {
            RoomType newRoomType = roomTypeRepository.findById(request.getRoomTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + request.getRoomTypeId()));
            existing.setRoomType(newRoomType);
        }

        // Update fields
        existing.setRoomNumber(request.getRoomNumber());
        existing.setFloor(request.getFloor());
        existing.setStatus(request.getStatus());

        // Save updated entity
        Room updated = roomRepository.save(existing);

        // Return response DTO
        return toResponse(updated);
    }

    /**
     * Delete a room by ID.
     */
    public void delete(Long id) {
        // Check if exists
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room not found with id: " + id);
        }

        // Delete
        roomRepository.deleteById(id);
    }

    /**
     * Convert entity to response DTO.
     */
    private RoomResponse toResponse(Room room) {
        RoomType roomType = room.getRoomType();
        RoomTypeResponse roomTypeResponse = new RoomTypeResponse(
                roomType.getId(),
                roomType.getName(),
                roomType.getBasePrice(),
                roomType.getMaxGuests(),
                roomType.getAmenities(),
                roomType.getDescription()
        );

        return new RoomResponse(
                room.getId(),
                room.getRoomNumber(),
                roomTypeResponse,
                room.getFloor(),
                room.getStatus()
        );
    }
}
