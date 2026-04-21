package com.roomify.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Room entity representing individual hotel rooms.
 * Each room belongs to a RoomType and has a unique room number.
 */
@Entity
@Table(name = "rooms", uniqueConstraints = {
    @UniqueConstraint(columnNames = "room_number", name = "uk_room_number")
})
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Room number is required")
    @Column(name = "room_number", nullable = false, unique = true, length = 50)
    private String roomNumber;

    @NotNull(message = "Room type is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "floor")
    private Integer floor;

    @NotNull(message = "Room status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoomStatus status;

    @Column(name = "display_name", length = 120)
    private String displayName;

    @Column(name = "primary_photo_url", length = 1000)
    private String primaryPhotoUrl;

    @Column(name = "gallery_photo_urls", columnDefinition = "TEXT")
    private String galleryPhotoUrls;

    @Column(name = "bed_type", length = 80)
    private String bedType;

    @Column(name = "view_type", length = 80)
    private String viewType;

    @Column(name = "size_square_meters")
    private Integer sizeSquareMeters;

    @Column(name = "featured_note", columnDefinition = "TEXT")
    private String featuredNote;

    @Column(name = "custom_amenities", columnDefinition = "TEXT")
    private String customAmenities;

    @Column(name = "is_bookable", nullable = false)
    private boolean bookable = true;

    // Constructors
    public Room() {}

    public Room(String roomNumber, RoomType roomType, Integer floor, RoomStatus status) {
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.floor = floor;
        this.status = status;
    }

    // Getters and Setters
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

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPrimaryPhotoUrl() {
        return primaryPhotoUrl;
    }

    public void setPrimaryPhotoUrl(String primaryPhotoUrl) {
        this.primaryPhotoUrl = primaryPhotoUrl;
    }

    public String getGalleryPhotoUrls() {
        return galleryPhotoUrls;
    }

    public void setGalleryPhotoUrls(String galleryPhotoUrls) {
        this.galleryPhotoUrls = galleryPhotoUrls;
    }

    public String getBedType() {
        return bedType;
    }

    public void setBedType(String bedType) {
        this.bedType = bedType;
    }

    public String getViewType() {
        return viewType;
    }

    public void setViewType(String viewType) {
        this.viewType = viewType;
    }

    public Integer getSizeSquareMeters() {
        return sizeSquareMeters;
    }

    public void setSizeSquareMeters(Integer sizeSquareMeters) {
        this.sizeSquareMeters = sizeSquareMeters;
    }

    public String getFeaturedNote() {
        return featuredNote;
    }

    public void setFeaturedNote(String featuredNote) {
        this.featuredNote = featuredNote;
    }

    public String getCustomAmenities() {
        return customAmenities;
    }

    public void setCustomAmenities(String customAmenities) {
        this.customAmenities = customAmenities;
    }

    public boolean isBookable() {
        return bookable;
    }

    public void setBookable(boolean bookable) {
        this.bookable = bookable;
    }
}
