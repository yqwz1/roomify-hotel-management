package com.roomify.backend.repository;

import com.roomify.backend.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findAllByOrderByNameAsc();

    List<InventoryItem> findByActiveTrueOrderByNameAsc();

    @Query("SELECT i FROM InventoryItem i WHERE i.active = true AND i.currentStockQuantity <= i.minimumStockThreshold ORDER BY i.currentStockQuantity ASC, i.name ASC")
    List<InventoryItem> findLowStockItems();
}
