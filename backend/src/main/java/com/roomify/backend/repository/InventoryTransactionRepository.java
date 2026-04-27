package com.roomify.backend.repository;

import com.roomify.backend.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findTop20ByOrderByOccurredAtDescIdDesc();

    List<InventoryTransaction> findByOccurredAtBetweenOrderByOccurredAtDescIdDesc(LocalDateTime start, LocalDateTime end);
}
