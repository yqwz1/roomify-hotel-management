package com.roomify.backend.controller;

import com.roomify.backend.dto.InventoryAdjustmentRequest;
import com.roomify.backend.dto.InventoryItemRequest;
import com.roomify.backend.dto.InventoryItemResponse;
import com.roomify.backend.dto.InventoryRestockRequest;
import com.roomify.backend.dto.InventoryRestockResponse;
import com.roomify.backend.dto.InventorySummaryResponse;
import com.roomify.backend.dto.InventoryTransactionResponse;
import com.roomify.backend.dto.ServiceUsageRecordResponse;
import com.roomify.backend.dto.ServiceUsageTemplateRequest;
import com.roomify.backend.dto.ServiceUsageTemplateResponse;
import com.roomify.backend.service.InventoryService;
import com.roomify.backend.service.ServiceUsageTemplateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasRole('MANAGER')")
public class InventoryController {

    private final InventoryService inventoryService;
    private final ServiceUsageTemplateService serviceUsageTemplateService;

    public InventoryController(
            InventoryService inventoryService,
            ServiceUsageTemplateService serviceUsageTemplateService) {
        this.inventoryService = inventoryService;
        this.serviceUsageTemplateService = serviceUsageTemplateService;
    }

    @GetMapping("/items")
    public List<InventoryItemResponse> listItems(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return inventoryService.listItems(activeOnly);
    }

    @GetMapping("/items/{id}")
    public InventoryItemResponse getItem(@PathVariable Long id) {
        return inventoryService.getItem(id);
    }

    @PostMapping("/items")
    public ResponseEntity<InventoryItemResponse> createItem(@Valid @RequestBody InventoryItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createItem(request));
    }

    @PutMapping("/items/{id}")
    public InventoryItemResponse updateItem(@PathVariable Long id, @Valid @RequestBody InventoryItemRequest request) {
        return inventoryService.updateItem(id, request);
    }

    @PostMapping("/items/{id}/restock")
    public ResponseEntity<InventoryRestockResponse> restockItem(
            @PathVariable Long id,
            @Valid @RequestBody InventoryRestockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.restockItem(id, request));
    }

    @PostMapping("/items/{id}/adjust")
    public InventoryTransactionResponse adjustItem(
            @PathVariable Long id,
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        return inventoryService.adjustItem(id, request);
    }

    @GetMapping("/transactions")
    public List<InventoryTransactionResponse> listTransactions(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return inventoryService.listTransactions(startDate, endDate);
    }

    @GetMapping("/usage-records")
    public List<ServiceUsageRecordResponse> listUsageRecords(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return inventoryService.listUsageRecords(startDate, endDate);
    }

    @GetMapping("/summary")
    public InventorySummaryResponse getSummary(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return inventoryService.getSummary(startDate, endDate);
    }

    @GetMapping("/templates")
    public List<ServiceUsageTemplateResponse> listTemplates() {
        return serviceUsageTemplateService.listTemplates();
    }

    @PostMapping("/templates")
    public ResponseEntity<ServiceUsageTemplateResponse> createTemplate(
            @Valid @RequestBody ServiceUsageTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceUsageTemplateService.createTemplate(request));
    }

    @PutMapping("/templates/{id}")
    public ServiceUsageTemplateResponse updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ServiceUsageTemplateRequest request) {
        return serviceUsageTemplateService.updateTemplate(id, request);
    }
}
