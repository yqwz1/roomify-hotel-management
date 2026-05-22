package com.roomify.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Reservation entity representing guest bookings for rooms.
 */
@Entity
@Table(
        name = "reservations",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "confirmation_number", name = "uk_reservation_confirmation_number")
        },
        indexes = {
                @Index(name = "idx_reservations_check_in_date", columnList = "check_in_date"),
                @Index(name = "idx_reservations_check_out_date", columnList = "check_out_date"),
                @Index(name = "idx_reservations_status", columnList = "status"),
                @Index(name = "idx_reservations_room_id", columnList = "room_id")
        })
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Guest is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @NotNull(message = "Room is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @NotNull(message = "Check-in date is required")
    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @NotNull(message = "Total price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Total price cannot be negative")
    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @NotNull(message = "Reservation status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;

    @NotBlank(message = "Confirmation number is required")
    @Size(max = 100, message = "Confirmation number cannot exceed 100 characters")
    @Column(name = "confirmation_number", nullable = false, unique = true, length = 100)
    private String confirmationNumber;

    @Column(name = "invoice_number", unique = true, length = 100)
    private String invoiceNumber;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "actual_check_in_date")
    private LocalDate actualCheckInDate;

    @Column(name = "actual_check_out_at")
    private LocalDateTime actualCheckOutAt;

    @Size(max = 500, message = "Cancellation reason cannot exceed 500 characters")
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "cancellation_at")
    private LocalDateTime cancellationAt;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Size(max = 500, message = "Modification reason cannot exceed 500 characters")
    @Column(name = "modification_reason", length = 500)
    private String modificationReason;

    @NotNull(message = "Total paid is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Total paid cannot be negative")
    @Column(name = "total_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @NotNull(message = "Outstanding balance is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Outstanding balance cannot be negative")
    @Column(name = "outstanding_balance", nullable = false, precision = 10, scale = 2)
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "invoice_finalized", nullable = false)
    private boolean invoiceFinalized = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "transaction_id", length = 120)
    private String transactionId;

    @Column(name = "payment_timestamp")
    private LocalDateTime paymentTimestamp;

    @Size(max = 1000, message = "Staff notes cannot exceed 1000 characters")
    @Column(name = "staff_notes", length = 1000)
    private String staffNotes;

    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    public Reservation() {
    }

    public Reservation(
            Guest guest,
            Room room,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            BigDecimal totalPrice,
            ReservationStatus status,
            String confirmationNumber) {
        this.guest = guest;
        this.room = room;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.totalPrice = totalPrice;
        this.status = status;
        this.confirmationNumber = confirmationNumber;
    }

    @PrePersist
    public void applyDefaults() {
        if (status == null) {
            status = ReservationStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (modifiedAt == null) {
            modifiedAt = LocalDateTime.now();
        }
        if (totalPaid == null || totalPaid.compareTo(BigDecimal.ZERO) < 0) {
            totalPaid = BigDecimal.ZERO;
        }
        if (outstandingBalance == null || outstandingBalance.compareTo(BigDecimal.ZERO) < 0) {
            outstandingBalance = totalPrice != null ? totalPrice : BigDecimal.ZERO;
        }
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.PENDING;
        }
        if (statusUpdatedAt == null) {
            statusUpdatedAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 0L;
        }
    }

    @PreUpdate
    public void touchModifiedAt() {
        modifiedAt = LocalDateTime.now();
        if (statusUpdatedAt == null) {
            statusUpdatedAt = modifiedAt;
        }
    }

    @AssertTrue(message = "Check-out date must be after check-in date")
    public boolean isDateRangeValid() {
        if (checkInDate == null || checkOutDate == null) {
            return true;
        }
        return checkOutDate.isAfter(checkInDate);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Guest getGuest() {
        return guest;
    }

    public void setGuest(Guest guest) {
        this.guest = guest;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public Long getGuestId() {
        return guest != null ? guest.getId() : null;
    }

    public Long getRoomId() {
        return room != null ? room.getId() : null;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDate getActualCheckInDate() {
        return actualCheckInDate;
    }

    public void setActualCheckInDate(LocalDate actualCheckInDate) {
        this.actualCheckInDate = actualCheckInDate;
    }

    public LocalDateTime getActualCheckOutAt() {
        return actualCheckOutAt;
    }

    public void setActualCheckOutAt(LocalDateTime actualCheckOutAt) {
        this.actualCheckOutAt = actualCheckOutAt;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public LocalDateTime getCancellationAt() {
        return cancellationAt;
    }

    public void setCancellationAt(LocalDateTime cancellationAt) {
        this.cancellationAt = cancellationAt;
    }

    public LocalDateTime getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(LocalDateTime modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public String getModificationReason() {
        return modificationReason;
    }

    public void setModificationReason(String modificationReason) {
        this.modificationReason = modificationReason;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public boolean isInvoiceFinalized() {
        return invoiceFinalized;
    }

    public void setInvoiceFinalized(boolean invoiceFinalized) {
        this.invoiceFinalized = invoiceFinalized;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public LocalDateTime getPaymentTimestamp() {
        return paymentTimestamp;
    }

    public void setPaymentTimestamp(LocalDateTime paymentTimestamp) {
        this.paymentTimestamp = paymentTimestamp;
    }

    public String getStaffNotes() {
        return staffNotes;
    }

    public void setStaffNotes(String staffNotes) {
        this.staffNotes = staffNotes;
    }

    public LocalDateTime getStatusUpdatedAt() {
        return statusUpdatedAt;
    }

    public void setStatusUpdatedAt(LocalDateTime statusUpdatedAt) {
        this.statusUpdatedAt = statusUpdatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
