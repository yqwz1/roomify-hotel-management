package com.roomify.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_charges")
public class ServiceCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Reservation reservation;

    @ManyToOne(optional = false)
    private HotelService service;

    private BigDecimal price;

    private int quantity;

    private BigDecimal total;

    private LocalDateTime createdAt;

    public ServiceCharge() {
    }

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public HotelService getService() {
        return service;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setReservation(Reservation reservation) {
        this.reservation = reservation;
    }

    public void setService(HotelService service) {
        this.service = service;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}