package com.roomify.backend.service;

import com.roomify.backend.dto.ExpenseRequest;
import com.roomify.backend.dto.ExpenseResponse;
import com.roomify.backend.dto.InventoryAdjustmentRequest;
import com.roomify.backend.dto.InventoryBreakdownItem;
import com.roomify.backend.dto.InventoryItemRequest;
import com.roomify.backend.dto.InventoryItemResponse;
import com.roomify.backend.dto.InventoryRestockRequest;
import com.roomify.backend.dto.InventoryRestockResponse;
import com.roomify.backend.dto.InventorySummaryResponse;
import com.roomify.backend.dto.InventoryTransactionResponse;
import com.roomify.backend.dto.ServiceUsageRecordResponse;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.InventoryCategory;
import com.roomify.backend.entity.InventoryItem;
import com.roomify.backend.entity.InventoryTransaction;
import com.roomify.backend.entity.InventoryTransactionType;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.entity.ServiceUsageRecord;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.InventoryItemRepository;
import com.roomify.backend.repository.InventoryTransactionRepository;
import com.roomify.backend.repository.ServiceUsageRecordRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ServiceUsageRecordRepository serviceUsageRecordRepository;
    private final UserRepository userRepository;
    private final ExpenseService expenseService;
    private final AuditService auditService;

    public InventoryService(
            InventoryItemRepository inventoryItemRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            ServiceUsageRecordRepository serviceUsageRecordRepository,
            UserRepository userRepository,
            ExpenseService expenseService,
            AuditService auditService) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.serviceUsageRecordRepository = serviceUsageRecordRepository;
        this.userRepository = userRepository;
        this.expenseService = expenseService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> listItems(boolean activeOnly) {
        List<InventoryItem> items = activeOnly
                ? inventoryItemRepository.findByActiveTrueOrderByNameAsc()
                : inventoryItemRepository.findAllByOrderByNameAsc();
        return items.stream().map(InventoryItemResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse getItem(Long id) {
        return InventoryItemResponse.from(findItem(id));
    }

    public InventoryItemResponse createItem(InventoryItemRequest request) {
        InventoryItem item = new InventoryItem();
        applyRequest(item, request);
        item.setCurrentStockQuantity(quantity(BigDecimal.ZERO));
        item.setAverageUnitCost(unitCost(request.getDefaultUnitCost()));
        item.setDefaultUnitCost(unitCost(request.getDefaultUnitCost()));

        InventoryItem saved = inventoryItemRepository.save(item);

        BigDecimal initialStock = quantity(request.getInitialStockQuantity());
        if (initialStock.compareTo(BigDecimal.ZERO) > 0) {
            applyStockIncrease(
                    saved,
                    initialStock,
                    unitCost(saved.getDefaultUnitCost()),
                    LocalDateTime.now(),
                    InventoryTransactionType.MANUAL_ADJUSTMENT,
                    "INITIAL_STOCK",
                    String.valueOf(saved.getId()),
                    "Initial stock balance",
                    "Initial stock balance");
        }

        auditService.log(
                "INVENTORY_ITEM_CREATED",
                "InventoryItem:" + saved.getId(),
                "{\"name\":\"" + saved.getName() + "\"}");
        return InventoryItemResponse.from(saved);
    }

    public InventoryItemResponse updateItem(Long id, InventoryItemRequest request) {
        InventoryItem item = findItem(id);
        applyRequest(item, request);
        item.setDefaultUnitCost(unitCost(request.getDefaultUnitCost()));
        if (item.getAverageUnitCost() == null || item.getAverageUnitCost().compareTo(BigDecimal.ZERO) == 0) {
            item.setAverageUnitCost(unitCost(request.getDefaultUnitCost()));
        }
        InventoryItem saved = inventoryItemRepository.save(item);
        auditService.log(
                "INVENTORY_ITEM_UPDATED",
                "InventoryItem:" + saved.getId(),
                "{\"name\":\"" + saved.getName() + "\"}");
        return InventoryItemResponse.from(saved);
    }

    public InventoryRestockResponse restockItem(Long id, InventoryRestockRequest request) {
        InventoryItem item = findItem(id);
        LocalDateTime occurredAt = request.getOccurredAt() != null ? request.getOccurredAt() : LocalDateTime.now();
        BigDecimal quantity = quantity(request.getQuantity());
        BigDecimal unitCost = unitCost(request.getUnitCost());

        ExpenseResponse linkedExpense = null;
        if (request.isLinkToExpense()) {
            linkedExpense = expenseService.createExpense(buildExpenseRequest(item, request, quantity, unitCost, occurredAt));
        }

        InventoryTransaction transaction = applyStockIncrease(
                item,
                quantity,
                unitCost,
                occurredAt,
                InventoryTransactionType.PURCHASE_RESTOCK,
                linkedExpense != null ? "EXPENSE" : "INVENTORY_RESTOCK",
                linkedExpense != null ? String.valueOf(linkedExpense.getId()) : String.valueOf(item.getId()),
                linkedExpense != null ? linkedExpense.getTitle() : "Inventory restock",
                request.getNotes());

        if (request.getSupplier() != null && !request.getSupplier().isBlank()) {
            item.setSupplier(request.getSupplier().trim());
            inventoryItemRepository.save(item);
        }

        auditService.log(
                "INVENTORY_RESTOCKED",
                "InventoryItem:" + item.getId(),
                "{\"quantity\":\"" + quantity + "\"}");
        return new InventoryRestockResponse(
                InventoryItemResponse.from(item),
                InventoryTransactionResponse.from(transaction),
                linkedExpense);
    }

    public InventoryTransactionResponse adjustItem(Long id, InventoryAdjustmentRequest request) {
        InventoryItem item = findItem(id);
        LocalDateTime occurredAt = request.getOccurredAt() != null ? request.getOccurredAt() : LocalDateTime.now();
        BigDecimal quantity = quantity(request.getQuantityChange());

        InventoryTransactionType type = request.getTransactionType();
        if (type == InventoryTransactionType.PURCHASE_RESTOCK || type == InventoryTransactionType.USAGE_CONSUMPTION) {
            throw new IllegalArgumentException("Use the dedicated restock or service usage flow for this transaction type");
        }

        InventoryTransaction transaction;
        if (type == InventoryTransactionType.WASTE_DAMAGE) {
            transaction = applyStockDecrease(item, quantity, occurredAt, type, "MANUAL_ADJUSTMENT", String.valueOf(item.getId()), "Waste or damage", request.getNotes());
        } else if (type == InventoryTransactionType.RETURN_CORRECTION) {
            transaction = applyStockIncrease(item, quantity, unitCost(request.getUnitCost()), occurredAt, type, "MANUAL_ADJUSTMENT", String.valueOf(item.getId()), "Return or correction", request.getNotes());
        } else {
            if (request.isIncreaseStock()) {
                transaction = applyStockIncrease(item, quantity, unitCost(request.getUnitCost()), occurredAt, type, "MANUAL_ADJUSTMENT", String.valueOf(item.getId()), "Manual adjustment", request.getNotes());
            } else {
                transaction = applyStockDecrease(item, quantity, occurredAt, type, "MANUAL_ADJUSTMENT", String.valueOf(item.getId()), "Manual adjustment", request.getNotes());
            }
        }

        auditService.log(
                "INVENTORY_ADJUSTED",
                "InventoryItem:" + item.getId(),
                "{\"quantity\":\"" + quantity + "\",\"type\":\"" + type + "\"}");
        return InventoryTransactionResponse.from(transaction);
    }

    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> listTransactions(LocalDate startDate, LocalDate endDate) {
        validateRange(startDate, endDate);
        List<InventoryTransaction> transactions = startDate == null
                ? inventoryTransactionRepository.findTop20ByOrderByOccurredAtDescIdDesc()
                : inventoryTransactionRepository.findByOccurredAtBetweenOrderByOccurredAtDescIdDesc(
                        startDate.atStartOfDay(),
                        endDate.plusDays(1).atStartOfDay().minusNanos(1));
        return transactions.stream().map(InventoryTransactionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceUsageRecordResponse> listUsageRecords(LocalDate startDate, LocalDate endDate) {
        validateRange(startDate, endDate);
        List<ServiceUsageRecord> records = startDate == null
                ? serviceUsageRecordRepository.findTop20ByOrderByPerformedAtDescIdDesc()
                : serviceUsageRecordRepository.findByServiceDateBetweenOrderByPerformedAtDescIdDesc(startDate, endDate);
        return records.stream().map(ServiceUsageRecordResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getSummary(LocalDate startDate, LocalDate endDate) {
        LocalDate resolvedEndDate = endDate == null ? LocalDate.now() : endDate;
        LocalDate resolvedStartDate = startDate == null ? resolvedEndDate.withDayOfMonth(1) : startDate;
        validateRange(resolvedStartDate, resolvedEndDate);

        List<InventoryItem> allItems = inventoryItemRepository.findAllByOrderByNameAsc();
        List<InventoryItem> lowStockItems = inventoryItemRepository.findLowStockItems();
        List<InventoryTransaction> periodTransactions = inventoryTransactionRepository.findByOccurredAtBetweenOrderByOccurredAtDescIdDesc(
                resolvedStartDate.atStartOfDay(),
                resolvedEndDate.plusDays(1).atStartOfDay().minusNanos(1));
        List<ServiceUsageRecord> periodUsageRecords = serviceUsageRecordRepository.findByServiceDateBetweenOrderByPerformedAtDescIdDesc(
                resolvedStartDate, resolvedEndDate);

        BigDecimal inventoryValue = allItems.stream()
                .map(item -> quantity(item.getCurrentStockQuantity()).multiply(unitCost(item.getAverageUnitCost())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPurchaseSpend = periodTransactions.stream()
                .filter(tx -> tx.getTransactionType() == InventoryTransactionType.PURCHASE_RESTOCK)
                .map(InventoryTransaction::getTotalValue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalConsumptionValue = periodTransactions.stream()
                .filter(tx -> tx.getTransactionType() == InventoryTransactionType.USAGE_CONSUMPTION)
                .map(InventoryTransaction::getTotalValue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalWasteValue = periodTransactions.stream()
                .filter(tx -> tx.getTransactionType() == InventoryTransactionType.WASTE_DAMAGE)
                .map(InventoryTransaction::getTotalValue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InventoryBreakdownItem> usageByCategory = buildUsageByCategory(periodUsageRecords);
        List<InventoryBreakdownItem> usageByRoomType = buildUsageByRoomType(periodUsageRecords);
        List<InventoryBreakdownItem> usageByServiceType = buildUsageByServiceType(periodUsageRecords);
        List<InventoryBreakdownItem> topConsumedItems = buildTopConsumedItems(periodUsageRecords);

        return new InventorySummaryResponse(
                resolvedStartDate,
                resolvedEndDate,
                allItems.size(),
                allItems.stream().filter(InventoryItem::isActive).count(),
                lowStockItems.size(),
                money(inventoryValue),
                money(totalPurchaseSpend),
                money(totalConsumptionValue),
                money(totalWasteValue),
                lowStockItems.stream().map(InventoryItemResponse::from).toList(),
                inventoryTransactionRepository.findTop20ByOrderByOccurredAtDescIdDesc().stream()
                        .map(InventoryTransactionResponse::from)
                        .toList(),
                serviceUsageRecordRepository.findTop20ByOrderByPerformedAtDescIdDesc().stream()
                        .map(ServiceUsageRecordResponse::from)
                        .toList(),
                usageByCategory,
                usageByRoomType,
                usageByServiceType,
                topConsumedItems);
    }

    public InventoryItem findItem(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
    }

    public ConsumptionResult consumeInventory(
            InventoryItem item,
            BigDecimal quantity,
            LocalDateTime occurredAt,
            String sourceReferenceType,
            String sourceReferenceId,
            String sourceReferenceLabel,
            String notes) {
        InventoryTransaction transaction = applyStockDecrease(
                item,
                quantity,
                occurredAt,
                InventoryTransactionType.USAGE_CONSUMPTION,
                sourceReferenceType,
                sourceReferenceId,
                sourceReferenceLabel,
                notes);
        return new ConsumptionResult(
                item,
                transaction,
                unitCost(transaction.getUnitCost()),
                money(transaction.getTotalValue()));
    }

    private void applyRequest(InventoryItem item, InventoryItemRequest request) {
        item.setName(request.getName().trim());
        item.setCategory(request.getCategory());
        item.setUnitOfMeasure(request.getUnitOfMeasure());
        item.setMinimumStockThreshold(quantity(request.getMinimumStockThreshold()));
        item.setSupplier(normalize(request.getSupplier()));
        item.setSku(normalize(request.getSku()));
        item.setActive(request.isActive());
        item.setNotes(normalize(request.getNotes()));
    }

    private InventoryTransaction applyStockIncrease(
            InventoryItem item,
            BigDecimal quantity,
            BigDecimal unitCost,
            LocalDateTime occurredAt,
            InventoryTransactionType type,
            String sourceReferenceType,
            String sourceReferenceId,
            String sourceReferenceLabel,
            String notes) {
        BigDecimal stockBefore = quantity(item.getCurrentStockQuantity());
        BigDecimal stockAfter = stockBefore.add(quantity);
        BigDecimal effectiveUnitCost = unitCost(unitCost);
        BigDecimal currentAverageCost = unitCost(item.getAverageUnitCost());
        BigDecimal currentStockValue = stockBefore.multiply(currentAverageCost);
        BigDecimal addedStockValue = quantity.multiply(effectiveUnitCost);

        item.setCurrentStockQuantity(stockAfter);
        item.setDefaultUnitCost(effectiveUnitCost);
        item.setAverageUnitCost(stockAfter.compareTo(BigDecimal.ZERO) > 0
                ? currentStockValue.add(addedStockValue).divide(stockAfter, 4, RoundingMode.HALF_UP)
                : effectiveUnitCost);
        inventoryItemRepository.save(item);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setItem(item);
        transaction.setTransactionType(type);
        transaction.setQuantityChange(quantity);
        transaction.setStockBefore(stockBefore);
        transaction.setStockAfter(stockAfter);
        transaction.setUnitCost(effectiveUnitCost);
        transaction.setTotalValue(money(quantity.multiply(effectiveUnitCost)));
        transaction.setOccurredAt(occurredAt);
        transaction.setSourceReferenceType(sourceReferenceType);
        transaction.setSourceReferenceId(sourceReferenceId);
        transaction.setSourceReferenceLabel(sourceReferenceLabel);
        transaction.setNotes(normalize(notes));
        resolveCurrentUser().ifPresent(transaction::setCreatedBy);
        return inventoryTransactionRepository.save(transaction);
    }

    private InventoryTransaction applyStockDecrease(
            InventoryItem item,
            BigDecimal quantity,
            LocalDateTime occurredAt,
            InventoryTransactionType type,
            String sourceReferenceType,
            String sourceReferenceId,
            String sourceReferenceLabel,
            String notes) {
        BigDecimal stockBefore = quantity(item.getCurrentStockQuantity());
        BigDecimal stockAfter = stockBefore.subtract(quantity);
        if (stockAfter.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Insufficient stock for item " + item.getName());
        }

        BigDecimal effectiveUnitCost = unitCost(item.getAverageUnitCost());
        item.setCurrentStockQuantity(stockAfter);
        inventoryItemRepository.save(item);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setItem(item);
        transaction.setTransactionType(type);
        transaction.setQuantityChange(quantity.negate());
        transaction.setStockBefore(stockBefore);
        transaction.setStockAfter(stockAfter);
        transaction.setUnitCost(effectiveUnitCost);
        transaction.setTotalValue(money(quantity.multiply(effectiveUnitCost)));
        transaction.setOccurredAt(occurredAt);
        transaction.setSourceReferenceType(sourceReferenceType);
        transaction.setSourceReferenceId(sourceReferenceId);
        transaction.setSourceReferenceLabel(sourceReferenceLabel);
        transaction.setNotes(normalize(notes));
        resolveCurrentUser().ifPresent(transaction::setCreatedBy);
        return inventoryTransactionRepository.save(transaction);
    }

    private ExpenseRequest buildExpenseRequest(
            InventoryItem item,
            InventoryRestockRequest request,
            BigDecimal quantity,
            BigDecimal unitCost,
            LocalDateTime occurredAt) {
        ExpenseRequest expenseRequest = new ExpenseRequest();
        expenseRequest.setTitle("Inventory restock: " + item.getName());
        expenseRequest.setDescription(normalize(request.getNotes()));
        expenseRequest.setCategory(request.getExpenseCategory() != null
                ? request.getExpenseCategory()
                : mapExpenseCategory(item.getCategory()));
        expenseRequest.setAmount(money(quantity.multiply(unitCost)));
        expenseRequest.setExpenseDate(occurredAt.toLocalDate());
        expenseRequest.setVendor(normalize(request.getSupplier()) != null
                ? normalize(request.getSupplier())
                : normalize(item.getSupplier()));
        expenseRequest.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CARD);
        expenseRequest.setRecurring(false);
        return expenseRequest;
    }

    private ExpenseCategory mapExpenseCategory(InventoryCategory category) {
        return switch (category) {
            case CLEANING_CHEMICALS -> ExpenseCategory.CLEANING_SUPPLIES;
            case TOILETRIES, CONSUMABLES, LAUNDRY_LINEN_SUPPLIES -> ExpenseCategory.CONSUMABLES;
            case MAINTENANCE_SUPPLIES -> ExpenseCategory.MAINTENANCE;
            case OFFICE_ADMIN_SUPPLIES -> ExpenseCategory.OFFICE_ADMIN;
            case MISCELLANEOUS -> ExpenseCategory.MISCELLANEOUS;
        };
    }

    private List<InventoryBreakdownItem> buildUsageByCategory(List<ServiceUsageRecord> records) {
        Map<String, List<com.roomify.backend.entity.ServiceUsageRecordItem>> grouped = records.stream()
                .flatMap(record -> record.getItems().stream())
                .collect(Collectors.groupingBy(item -> item.getInventoryItem().getCategory().name(), LinkedHashMap::new, Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    BigDecimal totalValue = entry.getValue().stream()
                            .map(com.roomify.backend.entity.ServiceUsageRecordItem::getTotalCost)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalQuantity = entry.getValue().stream()
                            .map(com.roomify.backend.entity.ServiceUsageRecordItem::getActualQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal averageCost = entry.getValue().isEmpty()
                            ? BigDecimal.ZERO
                            : totalValue.divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);
                    return new InventoryBreakdownItem(
                            entry.getKey(),
                            entry.getKey(),
                            money(totalValue),
                            quantity(totalQuantity),
                            entry.getValue().size(),
                            money(averageCost));
                })
                .sorted(Comparator.comparing(InventoryBreakdownItem::getTotalValue).reversed())
                .toList();
    }

    private List<InventoryBreakdownItem> buildUsageByRoomType(List<ServiceUsageRecord> records) {
        Map<String, List<ServiceUsageRecord>> grouped = records.stream()
                .collect(Collectors.groupingBy(
                        record -> record.getRoomType() != null ? record.getRoomType().getName() : "Unassigned",
                        LinkedHashMap::new,
                        Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    BigDecimal totalValue = entry.getValue().stream()
                            .map(ServiceUsageRecord::getTotalCost)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal averageCost = entry.getValue().isEmpty()
                            ? BigDecimal.ZERO
                            : totalValue.divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);
                    return new InventoryBreakdownItem(
                            entry.getKey(),
                            entry.getKey(),
                            money(totalValue),
                            BigDecimal.valueOf(entry.getValue().size()),
                            entry.getValue().size(),
                            money(averageCost));
                })
                .sorted(Comparator.comparing(InventoryBreakdownItem::getTotalValue).reversed())
                .toList();
    }

    private List<InventoryBreakdownItem> buildUsageByServiceType(List<ServiceUsageRecord> records) {
        Map<String, List<ServiceUsageRecord>> grouped = records.stream()
                .collect(Collectors.groupingBy(
                        record -> record.getServiceType().name(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    BigDecimal totalValue = entry.getValue().stream()
                            .map(ServiceUsageRecord::getTotalCost)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal averageCost = entry.getValue().isEmpty()
                            ? BigDecimal.ZERO
                            : totalValue.divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);
                    return new InventoryBreakdownItem(
                            entry.getKey(),
                            entry.getKey(),
                            money(totalValue),
                            BigDecimal.valueOf(entry.getValue().size()),
                            entry.getValue().size(),
                            money(averageCost));
                })
                .sorted(Comparator.comparing(InventoryBreakdownItem::getTotalValue).reversed())
                .toList();
    }

    private List<InventoryBreakdownItem> buildTopConsumedItems(List<ServiceUsageRecord> records) {
        Map<Long, List<com.roomify.backend.entity.ServiceUsageRecordItem>> grouped = records.stream()
                .flatMap(record -> record.getItems().stream())
                .collect(Collectors.groupingBy(item -> item.getInventoryItem().getId(), LinkedHashMap::new, Collectors.toList()));

        List<InventoryBreakdownItem> items = new ArrayList<>();
        for (Map.Entry<Long, List<com.roomify.backend.entity.ServiceUsageRecordItem>> entry : grouped.entrySet()) {
            com.roomify.backend.entity.ServiceUsageRecordItem first = entry.getValue().get(0);
            BigDecimal totalValue = entry.getValue().stream()
                    .map(com.roomify.backend.entity.ServiceUsageRecordItem::getTotalCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalQuantity = entry.getValue().stream()
                    .map(com.roomify.backend.entity.ServiceUsageRecordItem::getActualQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal averageCost = entry.getValue().isEmpty()
                    ? BigDecimal.ZERO
                    : totalValue.divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);
            items.add(new InventoryBreakdownItem(
                    String.valueOf(first.getInventoryItem().getId()),
                    first.getInventoryItem().getName(),
                    money(totalValue),
                    quantity(totalQuantity),
                    entry.getValue().size(),
                    money(averageCost)));
        }

        return items.stream()
                .sorted(Comparator.comparing(InventoryBreakdownItem::getTotalValue).reversed())
                .limit(10)
                .toList();
    }

    private Optional<User> resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName());
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if ((startDate == null) != (endDate == null)) {
            throw new IllegalArgumentException("Both start date and end date are required when filtering inventory data");
        }
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal quantity(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(3, RoundingMode.HALF_UP);
    }

    private BigDecimal unitCost(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(4, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static class ConsumptionResult {
        private final InventoryItem item;
        private final InventoryTransaction transaction;
        private final BigDecimal unitCost;
        private final BigDecimal totalCost;

        public ConsumptionResult(
                InventoryItem item,
                InventoryTransaction transaction,
                BigDecimal unitCost,
                BigDecimal totalCost) {
            this.item = item;
            this.transaction = transaction;
            this.unitCost = unitCost;
            this.totalCost = totalCost;
        }

        public InventoryItem getItem() {
            return item;
        }

        public InventoryTransaction getTransaction() {
            return transaction;
        }

        public BigDecimal getUnitCost() {
            return unitCost;
        }

        public BigDecimal getTotalCost() {
            return totalCost;
        }
    }
}
