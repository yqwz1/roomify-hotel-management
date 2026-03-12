package com.roomify.backend.service;

import com.roomify.backend.dto.RoomRequest;
import com.roomify.backend.dto.RoomResponse;
import com.roomify.backend.dto.RoomTypeResponse;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.exception.CannotDeleteException;
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

        public RoomService(RoomRepository roomRepository,
                        RoomTypeRepository roomTypeRepository) {
                this.roomRepository = roomRepository;
                this.roomTypeRepository = roomTypeRepository;
        }

        /**
         * Create a new room.
         */
        public RoomResponse create(RoomRequest request) {

                // Check room number uniqueness
                if (roomRepository.existsByRoomNumber(request.getRoomNumber())) {
                        throw new DuplicateResourceException(
                                        "Room with number '" + request.getRoomNumber() + "' already exists");
                }

                RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Room type not found with id: " + request.getRoomTypeId()));

                Room room = new Room(
                                request.getRoomNumber(),
                                roomType,
                                request.getFloor(),
                                request.getStatus());

                return toResponse(roomRepository.save(room));
        }

        /**
         * Get all rooms with optional filters.
         */
        public List<RoomResponse> findAll(String status,
                        Integer floor,
                        String typeName) {

                return roomRepository.findAll()
                                .stream()
                                .filter(room -> status == null ||
                                                room.getStatus() == RoomStatus.valueOf(status))
                                .filter(room -> floor == null ||
                                                floor.equals(room.getFloor()))
                                .filter(room -> typeName == null ||
                                                room.getRoomType().getName().equalsIgnoreCase(typeName))
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
         * Update room details (NOT status transitions).
         */
        public RoomResponse update(Long id, RoomRequest request) {

                Room existing = roomRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));

                if (!existing.getRoomNumber().equals(request.getRoomNumber())
                                && roomRepository.existsByRoomNumber(request.getRoomNumber())) {

                        throw new DuplicateResourceException(
                                        "Room with number '" + request.getRoomNumber() + "' already exists");
                }

                if (!existing.getRoomType().getId().equals(request.getRoomTypeId())) {
                        RoomType newRoomType = roomTypeRepository.findById(request.getRoomTypeId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Room type not found with id: " + request.getRoomTypeId()));
                        existing.setRoomType(newRoomType);
                }

                existing.setRoomNumber(request.getRoomNumber());
                existing.setFloor(request.getFloor());
                existing.setStatus(request.getStatus());

                return toResponse(roomRepository.save(existing));
        }

        /**
         * Update room status with transition validation.
         */
        public RoomResponse updateStatus(Long id, String status) {

                Room room = roomRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));

                RoomStatus newStatus = RoomStatus.valueOf(status);

                validateStatusTransition(room.getStatus(), newStatus);

                room.setStatus(newStatus);

                return toResponse(roomRepository.save(room));
        }

        /**
         * Delete a room by ID.
         */
        public void delete(Long id) {

                Room room = roomRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));

                if (room.getStatus() == RoomStatus.OCCUPIED) {
                        throw new CannotDeleteException(
                                        "Cannot delete an occupied room");
                }

                roomRepository.delete(room);
        }

        /**
         * Validate allowed room status transitions.
         */
        private void validateStatusTransition(RoomStatus current,
                        RoomStatus target) {

                // Occupied rooms cannot be manually modified
                if (current == RoomStatus.OCCUPIED) {
                        throw new IllegalStateException(
                                        "Occupied rooms cannot be manually modified");
                }

                boolean validTransition = false;

                // NeedsCleaning → Available
                if (current == RoomStatus.NEEDS_CLEANING
                                && target == RoomStatus.AVAILABLE) {
                        validTransition = true;
                }

                // Available → UnderMaintenance
                if (current == RoomStatus.AVAILABLE
                                && target == RoomStatus.UNDER_MAINTENANCE) {
                        validTransition = true;
                }

                // UnderMaintenance → Available
                if (current == RoomStatus.UNDER_MAINTENANCE
                                && target == RoomStatus.AVAILABLE) {
                        validTransition = true;
                }

                if (!validTransition) {
                        throw new IllegalStateException(
                                        "Invalid room status transition: "
                                                        + current + " -> " + target);
                }

                // Hook for housekeeping or maintenance notifications
                housekeepingHook(current, target);
        }

        /**
         * Hook for housekeeping / maintenance notifications.
         */
        private void housekeepingHook(RoomStatus current,
                        RoomStatus target) {

                if (current == RoomStatus.NEEDS_CLEANING
                                && target == RoomStatus.AVAILABLE) {

                        System.out.println("Housekeeping finished cleaning. Room is now available.");
                }

                if (current == RoomStatus.AVAILABLE
                                && target == RoomStatus.UNDER_MAINTENANCE) {

                        System.out.println("Room moved to maintenance.");
                }
        }

        /**
         * Convert Room entity to RoomResponse DTO.
         */
        private RoomResponse toResponse(Room room) {

                RoomType roomType = room.getRoomType();

                RoomTypeResponse roomTypeResponse = new RoomTypeResponse(
                                roomType.getId(),
                                roomType.getName(),
                                roomType.getBasePrice(),
                                roomType.getMaxGuests(),
                                roomType.getAmenities(),
                                roomType.getDescription());

                return new RoomResponse(
                                room.getId(),
                                room.getRoomNumber(),
                                roomTypeResponse,
                                room.getFloor(),
                                room.getStatus());
        }
}