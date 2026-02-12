package com.roomify.backend.repository;

import com.roomify.backend.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    
    /**
     * Find a room type by its unique name.
     * @param name the room type name
     * @return Optional containing the room type if found
     */
    Optional<RoomType> findByName(String name);
    
    /**
     * Check if a room type with the given name exists.
     * @param name the room type name
     * @return true if exists, false otherwise
     */
    boolean existsByName(String name);
    
    /**
     * Check if any rooms are assigned to this room type.
     * @param roomTypeId the room type ID
     * @return true if rooms are assigned, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Room r WHERE r.roomType.id = :roomTypeId")
    boolean hasAssignedRooms(@Param("roomTypeId") Long roomTypeId);
}
