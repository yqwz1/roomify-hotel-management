package com.roomify.backend.dto;

import com.roomify.backend.entity.ReservationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Purpose-built response DTO for the staff check-in lookup endpoint.
 * Structured into four logical sections (room, dates, guest, pricing)
 * so the Check-in UI can render a complete card without any follow-up API
 * calls.
 */
public class ReservationLookupResponse {

    private String confirmationNumber;
    private ReservationStatus status;
    private RoomInfo room;
    private DateInfo dates;
    private GuestInfo guest;
    private PricingInfo pricing;

    public ReservationLookupResponse() {
    }

    public ReservationLookupResponse(
            String confirmationNumber,
            ReservationStatus status,
            RoomInfo room,
            DateInfo dates,
            GuestInfo guest,
            PricingInfo pricing) {
        this.confirmationNumber = confirmationNumber;
        this.status = status;
        this.room = room;
        this.dates = dates;
        this.guest = guest;
        this.pricing = pricing;
    }

    // ─── Getters & Setters ───────────────────────────────────────────────────

    public String getConfirmationNumber() {
        return confirmationNumber;
    }

    public void setConfirmationNumber(String confirmationNumber) {
        this.confirmationNumber = confirmationNumber;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public RoomInfo getRoom() {
        return room;
    }

    public void setRoom(RoomInfo room) {
        this.room = room;
    }

    public DateInfo getDates() {
        return dates;
    }

    public void setDates(DateInfo dates) {
        this.dates = dates;
    }

    public GuestInfo getGuest() {
        return guest;
    }

    public void setGuest(GuestInfo guest) {
        this.guest = guest;
    }

    public PricingInfo getPricing() {
        return pricing;
    }

    public void setPricing(PricingInfo pricing) {
        this.pricing = pricing;
    }

    // ─── Nested: Room ────────────────────────────────────────────────────────

    public static class RoomInfo {
        private Long id;
        private String roomNumber;
        private Integer floor;
        private String roomTypeName;
        private Integer maxGuests;
        private String amenities;

        public RoomInfo() {
        }

        public RoomInfo(Long id, String roomNumber, Integer floor,
                String roomTypeName, Integer maxGuests, String amenities) {
            this.id = id;
            this.roomNumber = roomNumber;
            this.floor = floor;
            this.roomTypeName = roomTypeName;
            this.maxGuests = maxGuests;
            this.amenities = amenities;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getRoomNumber() {
            return roomNumber;
        }

        public void setRoomNumber(String roomNumber) {
            this.roomNumber = roomNumber;
        }

        public Integer getFloor() {
            return floor;
        }

        public void setFloor(Integer floor) {
            this.floor = floor;
        }

        public String getRoomTypeName() {
            return roomTypeName;
        }

        public void setRoomTypeName(String roomTypeName) {
            this.roomTypeName = roomTypeName;
        }

        public Integer getMaxGuests() {
            return maxGuests;
        }

        public void setMaxGuests(Integer maxGuests) {
            this.maxGuests = maxGuests;
        }

        public String getAmenities() {
            return amenities;
        }

        public void setAmenities(String amenities) {
            this.amenities = amenities;
        }
    }

    // ─── Nested: Dates ───────────────────────────────────────────────────────

    public static class DateInfo {
        private LocalDate checkIn;
        private LocalDate checkOut;
        private long nights;

        public DateInfo() {
        }

        public DateInfo(LocalDate checkIn, LocalDate checkOut, long nights) {
            this.checkIn = checkIn;
            this.checkOut = checkOut;
            this.nights = nights;
        }

        public LocalDate getCheckIn() {
            return checkIn;
        }

        public void setCheckIn(LocalDate checkIn) {
            this.checkIn = checkIn;
        }

        public LocalDate getCheckOut() {
            return checkOut;
        }

        public void setCheckOut(LocalDate checkOut) {
            this.checkOut = checkOut;
        }

        public long getNights() {
            return nights;
        }

        public void setNights(long nights) {
            this.nights = nights;
        }
    }

    // ─── Nested: Guest ───────────────────────────────────────────────────────

    public static class GuestInfo {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String idNumber;
        private String nationality;

        public GuestInfo() {
        }

        public GuestInfo(Long id, String name, String email,
                String phone, String idNumber, String nationality) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.idNumber = idNumber;
            this.nationality = nationality;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getIdNumber() {
            return idNumber;
        }

        public void setIdNumber(String idNumber) {
            this.idNumber = idNumber;
        }

        public String getNationality() {
            return nationality;
        }

        public void setNationality(String nationality) {
            this.nationality = nationality;
        }
    }

    // ─── Nested: Pricing ─────────────────────────────────────────────────────

    public static class PricingInfo {
        private BigDecimal roomRate;
        private BigDecimal subtotal;
        private BigDecimal taxes;
        private BigDecimal totalPrice;

        public PricingInfo() {
        }

        public PricingInfo(BigDecimal roomRate, BigDecimal subtotal,
                BigDecimal taxes, BigDecimal totalPrice) {
            this.roomRate = roomRate;
            this.subtotal = subtotal;
            this.taxes = taxes;
            this.totalPrice = totalPrice;
        }

        public BigDecimal getRoomRate() {
            return roomRate;
        }

        public void setRoomRate(BigDecimal roomRate) {
            this.roomRate = roomRate;
        }

        public BigDecimal getSubtotal() {
            return subtotal;
        }

        public void setSubtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
        }

        public BigDecimal getTaxes() {
            return taxes;
        }

        public void setTaxes(BigDecimal taxes) {
            this.taxes = taxes;
        }

        public BigDecimal getTotalPrice() {
            return totalPrice;
        }

        public void setTotalPrice(BigDecimal totalPrice) {
            this.totalPrice = totalPrice;
        }
    }
}
