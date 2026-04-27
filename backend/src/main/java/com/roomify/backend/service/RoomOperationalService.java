package com.roomify.backend.service;

import com.roomify.backend.dto.RoomResponse;
import com.roomify.backend.dto.RoomServiceCompletionRequest;
import com.roomify.backend.dto.RoomServiceCompletionResponse;
import com.roomify.backend.dto.RoomServicePreviewRequest;
import com.roomify.backend.dto.RoomServicePreviewResponse;
import com.roomify.backend.dto.RoomTypeResponse;
import com.roomify.backend.dto.ServiceUsagePreviewItemResponse;
import com.roomify.backend.dto.ServiceUsageRecordItemRequest;
import com.roomify.backend.dto.ServiceUsageRecordResponse;
import com.roomify.backend.entity.InventoryItem;
import com.roomify.backend.entity.Room;
import com.roomify.backend.entity.RoomStatus;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.entity.ServiceType;
import com.roomify.backend.entity.ServiceUsageRecord;
import com.roomify.backend.entity.ServiceUsageRecordItem;
import com.roomify.backend.entity.ServiceUsageTemplate;
import com.roomify.backend.entity.ServiceUsageTemplateItem;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.RoomRepository;
import com.roomify.backend.repository.ServiceUsageRecordRepository;
import com.roomify.backend.repository.ServiceUsageTemplateRepository;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class RoomOperationalService {

    private final RoomRepository roomRepository;
    private final ServiceUsageTemplateRepository serviceUsageTemplateRepository;
    private final ServiceUsageRecordRepository serviceUsageRecordRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public RoomOperationalService(
            RoomRepository roomRepository,
            ServiceUsageTemplateRepository serviceUsageTemplateRepository,
            ServiceUsageRecordRepository serviceUsageRecordRepository,
            InventoryService inventoryService,
            UserRepository userRepository,
            AuditService auditService) {
        this.roomRepository = roomRepository;
        this.serviceUsageTemplateRepository = serviceUsageTemplateRepository;
        this.serviceUsageRecordRepository = serviceUsageRecordRepository;
        this.inventoryService = inventoryService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public RoomServicePreviewResponse previewRoomService(Long roomId, RoomServicePreviewRequest request) {
        Room room = findRoom(roomId);
        ServiceType serviceType = request.getServiceType() != null ? request.getServiceType() : inferDefaultServiceType(room.getStatus());
        ServiceUsageTemplate template = resolveTemplate(serviceType, room.getRoomType());
        List<ServiceUsagePreviewItemResponse> items = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        BigDecimal totalCost = BigDecimal.ZERO;

        if (template == null) {
            warnings.add("No active template matched this room and service type");
        } else {
            for (ServiceUsageTemplateItem templateItem : template.getItems()) {
                if (!templateItem.isActive()) {
                    continue;
                }
                InventoryItem inventoryItem = templateItem.getInventoryItem();
                BigDecimal actualQuantity = quantity(templateItem.getStandardQuantity());
                BigDecimal currentStock = quantity(inventoryItem.getCurrentStockQuantity());
                BigDecimal projectedStockAfter = currentStock.subtract(actualQuantity);
                BigDecimal unitCost = unitCost(inventoryItem.getAverageUnitCost());
                BigDecimal estimatedCost = money(actualQuantity.multiply(unitCost));
                boolean lowStockAfter = projectedStockAfter.compareTo(quantity(inventoryItem.getMinimumStockThreshold())) <= 0;

                if (projectedStockAfter.compareTo(BigDecimal.ZERO) < 0) {
                    warnings.add("Insufficient stock forecast for " + inventoryItem.getName());
                }

                items.add(new ServiceUsagePreviewItemResponse(
                        inventoryItem.getId(),
                        inventoryItem.getName(),
                        inventoryItem.getCategory().name(),
                        inventoryItem.getUnitOfMeasure().name(),
                        templateItem.getStandardQuantity(),
                        actualQuantity,
                        currentStock,
                        projectedStockAfter,
                        unitCost,
                        estimatedCost,
                        lowStockAfter));
                totalCost = totalCost.add(estimatedCost);
            }
        }

        return new RoomServicePreviewResponse(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomType() != null ? room.getRoomType().getId() : null,
                room.getRoomType() != null ? room.getRoomType().getName() : null,
                room.getStatus(),
                serviceType,
                template != null ? template.getId() : null,
                template != null ? template.getName() : null,
                template != null,
                money(totalCost),
                items,
                warnings);
    }

    public RoomServiceCompletionResponse completeRoomService(Long roomId, RoomServiceCompletionRequest request) {
        Room room = findRoom(roomId);
        validateRoomCanCompleteService(room);

        LocalDateTime performedAt = request.getPerformedAt() != null ? request.getPerformedAt() : LocalDateTime.now();
        ServiceUsageTemplate template = resolveTemplate(request.getServiceType(), room.getRoomType());
        Map<Long, ServiceUsageTemplateItem> templateItems = new LinkedHashMap<>();
        if (template != null) {
            for (ServiceUsageTemplateItem item : template.getItems()) {
                if (item.isActive()) {
                    templateItems.put(item.getInventoryItem().getId(), item);
                }
            }
        }

        Map<Long, ServiceUsageRecordItemRequest> requestedItems = new LinkedHashMap<>();
        if (request.getItems() != null) {
            for (ServiceUsageRecordItemRequest itemRequest : request.getItems()) {
                if (requestedItems.put(itemRequest.getInventoryItemId(), itemRequest) != null) {
                    throw new IllegalArgumentException("Duplicate inventory items are not allowed in actual usage");
                }
            }
        }

        List<ResolvedUsageItem> finalItems = buildFinalItems(templateItems, requestedItems, template, request.isApplyStandardTemplate());
        if (finalItems.isEmpty()) {
            throw new IllegalArgumentException("No service usage items were provided and no active template matched this service");
        }

        List<String> insufficientStock = new ArrayList<>();
        for (ResolvedUsageItem resolvedItem : finalItems) {
            BigDecimal projectedStock = quantity(resolvedItem.inventoryItem().getCurrentStockQuantity()).subtract(quantity(resolvedItem.actualQuantity()));
            if (projectedStock.compareTo(BigDecimal.ZERO) < 0) {
                insufficientStock.add(resolvedItem.inventoryItem().getName());
            }
        }
        if (!insufficientStock.isEmpty()) {
            throw new IllegalStateException("Insufficient stock for: " + String.join(", ", insufficientStock));
        }

        ServiceUsageRecord usageRecord = new ServiceUsageRecord();
        usageRecord.setRoom(room);
        usageRecord.setRoomType(room.getRoomType());
        usageRecord.setServiceType(request.getServiceType());
        usageRecord.setTemplate(template);
        usageRecord.setAppliedStandardTemplate(template != null && request.isApplyStandardTemplate());
        usageRecord.setSourceRoomStatus(room.getStatus());
        usageRecord.setPerformedAt(performedAt);
        usageRecord.setServiceDate(performedAt.toLocalDate());
        usageRecord.setNotes(normalize(request.getNotes()));
        resolveCurrentUser().ifPresent(usageRecord::setCreatedBy);
        usageRecord = serviceUsageRecordRepository.save(usageRecord);

        BigDecimal totalCost = BigDecimal.ZERO;
        List<String> warnings = new ArrayList<>();
        for (ResolvedUsageItem resolvedItem : finalItems) {
            InventoryService.ConsumptionResult consumptionResult = inventoryService.consumeInventory(
                    resolvedItem.inventoryItem(),
                    resolvedItem.actualQuantity(),
                    performedAt,
                    "ROOM_SERVICE",
                    String.valueOf(usageRecord.getId()),
                    room.getRoomNumber() + " " + request.getServiceType().name(),
                    resolvedItem.notes());

            ServiceUsageRecordItem usageItem = new ServiceUsageRecordItem();
            usageItem.setUsageRecord(usageRecord);
            usageItem.setInventoryItem(resolvedItem.inventoryItem());
            usageItem.setTemplateItem(resolvedItem.templateItem());
            usageItem.setStandardQuantity(resolvedItem.standardQuantity());
            usageItem.setActualQuantity(resolvedItem.actualQuantity());
            usageItem.setUnitCost(consumptionResult.getUnitCost());
            usageItem.setTotalCost(consumptionResult.getTotalCost());
            usageItem.setNotes(resolvedItem.notes());
            usageRecord.getItems().add(usageItem);
            totalCost = totalCost.add(consumptionResult.getTotalCost());

            if (quantity(resolvedItem.inventoryItem().getCurrentStockQuantity())
                    .compareTo(quantity(resolvedItem.inventoryItem().getMinimumStockThreshold())) <= 0) {
                warnings.add("Low stock: " + resolvedItem.inventoryItem().getName());
            }
        }

        usageRecord.setTotalCost(money(totalCost));
        ServiceUsageRecord savedUsageRecord = serviceUsageRecordRepository.save(usageRecord);

        room.setStatus(RoomStatus.AVAILABLE);
        roomRepository.save(room);

        auditService.log(
                "ROOM_SERVICE_COMPLETED",
                "Room:" + room.getId(),
                "{\"serviceType\":\"" + request.getServiceType() + "\",\"usageRecordId\":\"" + savedUsageRecord.getId() + "\"}");

        return new RoomServiceCompletionResponse(
                toRoomResponse(room),
                ServiceUsageRecordResponse.from(savedUsageRecord),
                warnings);
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private void validateRoomCanCompleteService(Room room) {
        if (room.getStatus() != RoomStatus.NEEDS_CLEANING && room.getStatus() != RoomStatus.UNDER_MAINTENANCE) {
            throw new ResourceConflictException("This room is not awaiting a cleaning or maintenance completion flow");
        }
    }

    private ServiceType inferDefaultServiceType(RoomStatus status) {
        return switch (status) {
            case NEEDS_CLEANING -> ServiceType.STANDARD_ROOM_CLEANING;
            case UNDER_MAINTENANCE -> ServiceType.MAINTENANCE_VISIT;
            default -> throw new ResourceConflictException("No default service type exists for room status " + status);
        };
    }

    private ServiceUsageTemplate resolveTemplate(ServiceType serviceType, RoomType roomType) {
        if (roomType != null) {
            Optional<ServiceUsageTemplate> roomTypeTemplate = serviceUsageTemplateRepository
                    .findFirstByServiceTypeAndRoomTypeIdAndActiveTrue(serviceType, roomType.getId());
            if (roomTypeTemplate.isPresent()) {
                return roomTypeTemplate.get();
            }
        }
        return serviceUsageTemplateRepository.findFirstByServiceTypeAndRoomTypeIsNullAndActiveTrue(serviceType)
                .orElse(null);
    }

    private List<ResolvedUsageItem> buildFinalItems(
            Map<Long, ServiceUsageTemplateItem> templateItems,
            Map<Long, ServiceUsageRecordItemRequest> requestedItems,
            ServiceUsageTemplate template,
            boolean applyStandardTemplate) {
        List<ResolvedUsageItem> resolvedItems = new ArrayList<>();
        if (requestedItems.isEmpty()) {
            if (template == null || !applyStandardTemplate) {
                return resolvedItems;
            }
            for (ServiceUsageTemplateItem templateItem : templateItems.values()) {
                resolvedItems.add(new ResolvedUsageItem(
                        templateItem.getInventoryItem(),
                        templateItem,
                        quantity(templateItem.getStandardQuantity()),
                        quantity(templateItem.getStandardQuantity()),
                        normalize(templateItem.getNotes())));
            }
            return resolvedItems;
        }

        for (ServiceUsageRecordItemRequest requestItem : requestedItems.values()) {
            InventoryItem inventoryItem = inventoryService.findItem(requestItem.getInventoryItemId());
            ServiceUsageTemplateItem templateItem = templateItems.get(requestItem.getInventoryItemId());
            BigDecimal standardQuantity = templateItem != null ? quantity(templateItem.getStandardQuantity()) : null;
            resolvedItems.add(new ResolvedUsageItem(
                    inventoryItem,
                    templateItem,
                    standardQuantity,
                    quantity(requestItem.getActualQuantity()),
                    normalize(requestItem.getNotes())));
        }
        return resolvedItems;
    }

    private RoomResponse toRoomResponse(Room room) {
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

    private Optional<User> resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName());
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

    private record ResolvedUsageItem(
            InventoryItem inventoryItem,
            ServiceUsageTemplateItem templateItem,
            BigDecimal standardQuantity,
            BigDecimal actualQuantity,
            String notes) {
    }
}
