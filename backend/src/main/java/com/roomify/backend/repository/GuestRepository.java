package com.roomify.backend.repository;

import com.roomify.backend.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for Guest entity.
 */
@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {

    /**
     * Find a guest by their email address.
     * 
     * @param email the email address
     * @return Optional containing the guest if found
     */
    Optional<Guest> findByEmail(String email);

    /**
     * Check if a guest with the given email exists.
     * 
     * @param email the email address
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Check if a guest with the given ID number exists.
     * 
     * @param idNumber the ID number
     * @return true if exists, false otherwise
     */
    boolean existsByIdNumber(String idNumber);
}
