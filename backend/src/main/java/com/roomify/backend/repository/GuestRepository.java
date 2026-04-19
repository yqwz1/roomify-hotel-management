package com.roomify.backend.repository;

import com.roomify.backend.entity.Guest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {

    Optional<Guest> findByEmail(String email);

    Optional<Guest> findByEmailIgnoreCase(String email);

    List<Guest> findAllByEmailIgnoreCaseOrderByIdAsc(String email);

    Optional<Guest> findByIdNumber(String idNumber);

    boolean existsByEmail(String email);

    boolean existsByIdNumber(String idNumber);
}
