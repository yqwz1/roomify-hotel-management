package com.roomify.backend.entity;

import com.roomify.backend.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_usage_records")
public class ServiceUsageRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id")
    private RoomType roomType;

    @NotNull(message = "Service type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 40)
    private ServiceType serviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ServiceUsageTemplate template;

    @Column(name = "applied_standard_template", nullable = false)
    private boolean appliedStandardTemplate = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_room_status", length = 30)
    private RoomStatus sourceRoomStatus;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    @Digits(integer = 12, fraction = 2, message = "Total cost must have up to 12 digits and 2 decimals")
    @Column(name = "total_cost", nullable = false, precision = 16, scale = 2)
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    @Column(length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @OneToMany(mappedBy = "usageRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<ServiceUsageRecordItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (performedAt == null) {
            performedAt = now;
        }
        if (serviceDate == null) {
            serviceDate = performedAt.toLocalDate();
        }
        totalCost = (totalCost == null ? BigDecimal.ZERO : totalCost).setScale(2, RoundingMode.HALF_UP);
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
        totalCost = (totalCost == null ? BigDecimal.ZERO : totalCost).setScale(2, RoundingMode.HALF_UP);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }

    public ServiceUsageTemplate getTemplate() {
        return template;
    }

    public void setTemplate(ServiceUsageTemplate template) {
        this.template = template;
    }

    public boolean isAppliedStandardTemplate() {
        return appliedStandardTemplate;
    }

    public void setAppliedStandardTemplate(boolean appliedStandardTemplate) {
        this.appliedStandardTemplate = appliedStandardTemplate;
    }

    public RoomStatus getSourceRoomStatus() {
        return sourceRoomStatus;
    }

    public void setSourceRoomStatus(RoomStatus sourceRoomStatus) {
        this.sourceRoomStatus = sourceRoomStatus;
    }

    public LocalDate getServiceDate() {
        return serviceDate;
    }

    public void setServiceDate(LocalDate serviceDate) {
        this.serviceDate = serviceDate;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public List<ServiceUsageRecordItem> getItems() {
        return items;
    }

    public void setItems(List<ServiceUsageRecordItem> items) {
        this.items = items;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
