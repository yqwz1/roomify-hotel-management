package com.roomify.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class InventorySummaryResponse {

    private final LocalDate startDate;
    private final LocalDate endDate;
    private final long totalItems;
    private final long activeItems;
    private final long lowStockCount;
    private final BigDecimal currentInventoryValue;
    private final BigDecimal totalPurchaseSpend;
    private final BigDecimal totalConsumptionValue;
    private final BigDecimal totalWasteValue;
    private final List<InventoryItemResponse> lowStockItems;
    private final List<InventoryTransactionResponse> recentTransactions;
    private final List<ServiceUsageRecordResponse> recentUsageRecords;
    private final List<InventoryBreakdownItem> usageByCategory;
    private final List<InventoryBreakdownItem> usageByRoomType;
    private final List<InventoryBreakdownItem> usageByServiceType;
    private final List<InventoryBreakdownItem> topConsumedItems;

    public InventorySummaryResponse(
            LocalDate startDate,
            LocalDate endDate,
            long totalItems,
            long activeItems,
            long lowStockCount,
            BigDecimal currentInventoryValue,
            BigDecimal totalPurchaseSpend,
            BigDecimal totalConsumptionValue,
            BigDecimal totalWasteValue,
            List<InventoryItemResponse> lowStockItems,
            List<InventoryTransactionResponse> recentTransactions,
            List<ServiceUsageRecordResponse> recentUsageRecords,
            List<InventoryBreakdownItem> usageByCategory,
            List<InventoryBreakdownItem> usageByRoomType,
            List<InventoryBreakdownItem> usageByServiceType,
            List<InventoryBreakdownItem> topConsumedItems) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalItems = totalItems;
        this.activeItems = activeItems;
        this.lowStockCount = lowStockCount;
        this.currentInventoryValue = currentInventoryValue;
        this.totalPurchaseSpend = totalPurchaseSpend;
        this.totalConsumptionValue = totalConsumptionValue;
        this.totalWasteValue = totalWasteValue;
        this.lowStockItems = lowStockItems;
        this.recentTransactions = recentTransactions;
        this.recentUsageRecords = recentUsageRecords;
        this.usageByCategory = usageByCategory;
        this.usageByRoomType = usageByRoomType;
        this.usageByServiceType = usageByServiceType;
        this.topConsumedItems = topConsumedItems;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public long getActiveItems() {
        return activeItems;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public BigDecimal getCurrentInventoryValue() {
        return currentInventoryValue;
    }

    public BigDecimal getTotalPurchaseSpend() {
        return totalPurchaseSpend;
    }

    public BigDecimal getTotalConsumptionValue() {
        return totalConsumptionValue;
    }

    public BigDecimal getTotalWasteValue() {
        return totalWasteValue;
    }

    public List<InventoryItemResponse> getLowStockItems() {
        return lowStockItems;
    }

    public List<InventoryTransactionResponse> getRecentTransactions() {
        return recentTransactions;
    }

    public List<ServiceUsageRecordResponse> getRecentUsageRecords() {
        return recentUsageRecords;
    }

    public List<InventoryBreakdownItem> getUsageByCategory() {
        return usageByCategory;
    }

    public List<InventoryBreakdownItem> getUsageByRoomType() {
        return usageByRoomType;
    }

    public List<InventoryBreakdownItem> getUsageByServiceType() {
        return usageByServiceType;
    }

    public List<InventoryBreakdownItem> getTopConsumedItems() {
        return topConsumedItems;
    }
}
