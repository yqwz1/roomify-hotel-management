package com.roomify.backend.service;

import com.roomify.backend.dto.ServiceUsageTemplateItemRequest;
import com.roomify.backend.dto.ServiceUsageTemplateResponse;
import com.roomify.backend.dto.ServiceUsageTemplateRequest;
import com.roomify.backend.entity.InventoryItem;
import com.roomify.backend.entity.RoomType;
import com.roomify.backend.entity.ServiceUsageTemplate;
import com.roomify.backend.entity.ServiceUsageTemplateItem;
import com.roomify.backend.exception.ResourceConflictException;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.RoomTypeRepository;
import com.roomify.backend.repository.ServiceUsageTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class ServiceUsageTemplateService {

    private final ServiceUsageTemplateRepository serviceUsageTemplateRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final InventoryService inventoryService;
    private final AuditService auditService;

    public ServiceUsageTemplateService(
            ServiceUsageTemplateRepository serviceUsageTemplateRepository,
            RoomTypeRepository roomTypeRepository,
            InventoryService inventoryService,
            AuditService auditService) {
        this.serviceUsageTemplateRepository = serviceUsageTemplateRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.inventoryService = inventoryService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ServiceUsageTemplateResponse> listTemplates() {
        return serviceUsageTemplateRepository.findAllByOrderByServiceTypeAscNameAsc().stream()
                .map(ServiceUsageTemplateResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceUsageTemplateResponse getTemplate(Long id) {
        return ServiceUsageTemplateResponse.from(findTemplate(id));
    }

    public ServiceUsageTemplateResponse createTemplate(ServiceUsageTemplateRequest request) {
        ServiceUsageTemplate template = new ServiceUsageTemplate();
        applyRequest(template, request);
        ServiceUsageTemplate saved = serviceUsageTemplateRepository.save(template);
        auditService.log(
                "SERVICE_TEMPLATE_CREATED",
                "ServiceUsageTemplate:" + saved.getId(),
                "{\"name\":\"" + saved.getName() + "\"}");
        return ServiceUsageTemplateResponse.from(saved);
    }

    public ServiceUsageTemplateResponse updateTemplate(Long id, ServiceUsageTemplateRequest request) {
        ServiceUsageTemplate template = findTemplate(id);
        applyRequest(template, request);
        ServiceUsageTemplate saved = serviceUsageTemplateRepository.save(template);
        auditService.log(
                "SERVICE_TEMPLATE_UPDATED",
                "ServiceUsageTemplate:" + saved.getId(),
                "{\"name\":\"" + saved.getName() + "\"}");
        return ServiceUsageTemplateResponse.from(saved);
    }

    private ServiceUsageTemplate findTemplate(Long id) {
        return serviceUsageTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service usage template not found"));
    }

    private void applyRequest(ServiceUsageTemplate template, ServiceUsageTemplateRequest request) {
        template.setName(request.getName().trim());
        template.setServiceType(request.getServiceType());
        template.setActive(request.isActive());
        template.setNotes(request.getNotes() == null || request.getNotes().isBlank() ? null : request.getNotes().trim());

        RoomType roomType = null;
        if (request.getRoomTypeId() != null) {
            roomType = roomTypeRepository.findById(request.getRoomTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        }
        template.setRoomType(roomType);

        validateUniqueItems(request.getItems());
        template.getItems().clear();
        for (ServiceUsageTemplateItemRequest itemRequest : request.getItems()) {
            InventoryItem inventoryItem = inventoryService.findItem(itemRequest.getInventoryItemId());
            ServiceUsageTemplateItem templateItem = new ServiceUsageTemplateItem();
            templateItem.setTemplate(template);
            templateItem.setInventoryItem(inventoryItem);
            templateItem.setStandardQuantity(itemRequest.getStandardQuantity());
            templateItem.setActive(itemRequest.isActive());
            templateItem.setNotes(itemRequest.getNotes() == null || itemRequest.getNotes().isBlank() ? null : itemRequest.getNotes().trim());
            template.getItems().add(templateItem);
        }
    }

    private void validateUniqueItems(List<ServiceUsageTemplateItemRequest> items) {
        Set<Long> ids = new HashSet<>();
        for (ServiceUsageTemplateItemRequest item : items) {
            if (!ids.add(item.getInventoryItemId())) {
                throw new ResourceConflictException("Template items must not contain duplicate inventory items");
            }
        }
    }
}
