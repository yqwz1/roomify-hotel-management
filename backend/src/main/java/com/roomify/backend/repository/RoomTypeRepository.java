package com.roomify.backend.repository;

import com.roomify.backend.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
