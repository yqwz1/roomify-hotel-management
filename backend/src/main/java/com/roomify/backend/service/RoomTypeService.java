package com.roomify.backend.service;

import com.roomify.backend.dto.RoomTypeRequest;
import com.roomify.backend.dto.RoomTypeResponse;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.CannotDeleteException;
import com.roomify.backend.exception.DuplicateResourceException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final AuditService auditService; // 🔹 Audit service added

    public RoomTypeService(RoomTypeRepository roomTypeRepository, AuditService auditService) {
        this.roomTypeRepository = roomTypeRepository;
        this.auditService = auditService;
    }

    /**
     * Create a new room type.
     */
    public RoomTypeResponse create(RoomTypeRequest request) {
        // Check if name already exists
        if (roomTypeRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Room type with name '" + request.getName() + "' already exists");
        }

        // Create entity from DTO
        RoomType roomType = new RoomType(
                request.getName(),
                request.getBasePrice(),
                request.getMaxGuests(),
                request.getAmenities(),
                request.getDescription());

        // Save to repository
        RoomType saved = roomTypeRepository.save(roomType);

        // 🔹 Audit log
        auditService.log(
                "CREATE_ROOM_TYPE",
                "RoomType#" + saved.getId(),
                "name=" + saved.getName());

        // Return response DTO
        return toResponse(saved);
    }

    /**
     * Get all room types.
     */
    public List<RoomTypeResponse> findAll() {
        return roomTypeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get room type by ID.
     */
    public RoomTypeResponse findById(Long id) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));
        return toResponse(roomType);
    }

    /**
     * Update an existing room type.
     */
    public RoomTypeResponse update(Long id, RoomTypeRequest request) {
        // Find existing room type
        RoomType existing = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));

        // Check if new name conflicts with another room type
        if (!existing.getName().equals(request.getName()) && roomTypeRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Room type with name '" + request.getName() + "' already exists");
        }

        // Update fields
        existing.setName(request.getName());
        existing.setBasePrice(request.getBasePrice());
        existing.setMaxGuests(request.getMaxGuests());
        existing.setAmenities(request.getAmenities());
        existing.setDescription(request.getDescription());

        // Save updated entity
        RoomType updated = roomTypeRepository.save(existing);

        // 🔹 Audit log
        auditService.log(
                "UPDATE_ROOM_TYPE",
                "RoomType#" + updated.getId(),
                "name=" + updated.getName());

        // Return response DTO
        return toResponse(updated);
    }

    /**
     * Delete a room type by ID.
     * Prevents deletion if any rooms are assigned to this type.
     */
    public void delete(Long id) {
        // Check if exists
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));

        // Check if any rooms are assigned to this type
        if (roomTypeRepository.hasAssignedRooms(id)) {
            throw new CannotDeleteException(
                    "Cannot delete room type: rooms are currently assigned to this type");
        }

        // 🔹 Audit log BEFORE deletion
        auditService.log(
                "DELETE_ROOM_TYPE",
                "RoomType#" + id,
                "name=" + roomType.getName());

        // Delete
        roomTypeRepository.deleteById(id);
    }

    /**
     * Convert entity to response DTO.
     */
    private RoomTypeResponse toResponse(RoomType roomType) {
        return new RoomTypeResponse(
                roomType.getId(),
                roomType.getName(),
                roomType.getBasePrice(),
                roomType.getMaxGuests(),
                roomType.getAmenities(),
                roomType.getDescription());
    }

    // 🔹 Stub methods for upcoming security features (Day 3–4)

    public void lockRoomType(Long id) {
        auditService.log("LOCK_ROOM_TYPE", "RoomType#" + id, null);
    }

    public void unlockRoomType(Long id) {
        auditService.log("UNLOCK_ROOM_TYPE", "RoomType#" + id, null);
    }
}
