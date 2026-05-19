package com.roomify.backend.repository;

import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Room entity.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    
    /**
     * Find a room by its unique room number.
     * @param roomNumber the room number
     * @return Optional containing the room if found
     */
    Optional<Room> findByRoomNumber(String roomNumber);
    
    /**
     * Check if a room with the given room number exists.
     * @param roomNumber the room number
     * @return true if exists, false otherwise
     */
    boolean existsByRoomNumber(String roomNumber);
    
    /**
     * Find all rooms of a specific room type.
     * @param roomType the room type
     * @return list of rooms
     */
    List<Room> findByRoomType(RoomType roomType);
    
    /**
     * Count rooms of a specific room type.
     * @param roomType the room type
     * @return count of rooms
     */
    long countByRoomType(RoomType roomType);

    /**
     * Find all rooms with their room type eagerly loaded, ordered by room number.
     * Used by the room grid endpoint to render every room as a row.
     */
    @Query("SELECT r FROM Room r JOIN FETCH r.roomType ORDER BY r.roomNumber ASC")
    List<Room> findAllWithRoomTypeOrderByRoomNumber();
}
