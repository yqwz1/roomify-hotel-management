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
        if (roomTypeRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Room type with name '" + request.getName() + "' already exists");
        }

        RoomType roomType = new RoomType(
                request.getName(),
                request.getBasePrice(),
                request.getMaxGuests(),
                request.getAmenities(),
                request.getDescription());

        RoomType saved = roomTypeRepository.save(roomType);

        auditService.log(
                "CREATE_ROOM_TYPE",
                "RoomType#" + saved.getId(),
                "name=" + saved.getName());

        return toResponse(saved);
    }

    public List<RoomTypeResponse> findAll() {
        return roomTypeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public RoomTypeResponse findById(Long id) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));
        return toResponse(roomType);
    }

    public RoomTypeResponse update(Long id, RoomTypeRequest request) {
        RoomType existing = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));

        if (!existing.getName().equals(request.getName())
                && roomTypeRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Room type with name '" + request.getName() + "' already exists");
        }

        existing.setName(request.getName());
        existing.setBasePrice(request.getBasePrice());
        existing.setMaxGuests(request.getMaxGuests());
        existing.setAmenities(request.getAmenities());
        existing.setDescription(request.getDescription());

        RoomType updated = roomTypeRepository.save(existing);

        auditService.log(
                "UPDATE_ROOM_TYPE",
                "RoomType#" + updated.getId(),
                "name=" + updated.getName());

        return toResponse(updated);
    }

    public void delete(Long id) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));

        if (roomTypeRepository.hasAssignedRooms(id)) {
            throw new CannotDeleteException(
                    "Cannot delete room type: rooms are currently assigned to this type");
        }

        auditService.log(
                "DELETE_ROOM_TYPE",
                "RoomType#" + id,
                "name=" + roomType.getName());

        roomTypeRepository.deleteById(id);
    }

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