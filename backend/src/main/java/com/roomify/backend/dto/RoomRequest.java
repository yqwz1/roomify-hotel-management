package com.roomify.backend.dto;

import com.roomify.backend.entity.RoomStatus;
import jakarta.validation.constraints.*;

/**
 * Request DTO for creating or updating a Room.
 */
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    @Size(min = 1, max = 50, message = "Room number must be between 1 and 50 characters")
    private String roomNumber;

    @NotNull(message = "Room type ID is required")
    private Long roomTypeId;

    @Min(value = 1, message = "Floor must be at least 1")
    private Integer floor;

    @NotNull(message = "Room status is required")
    private RoomStatus status;

    @Size(max = 120, message = "Display name cannot exceed 120 characters")
    private String displayName;

    @Size(max = 1000, message = "Primary photo URL cannot exceed 1000 characters")
    private String primaryPhotoUrl;

    private String galleryPhotoUrls;

    @Size(max = 80, message = "Bed type cannot exceed 80 characters")
    private String bedType;

    @Size(max = 80, message = "View type cannot exceed 80 characters")
    private String viewType;

    @Min(value = 1, message = "Room size must be at least 1 square meter")
    private Integer sizeSquareMeters;

    private String featuredNote;

    private String customAmenities;

    private Boolean bookable;

    // Constructors
    public RoomRequest() {}

    public RoomRequest(String roomNumber, Long roomTypeId, Integer floor, RoomStatus status) {
        this.roomNumber = roomNumber;
        this.roomTypeId = roomTypeId;
        this.floor = floor;
        this.status = status;
    }

    // Getters and Setters
    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public void setRoomTypeId(Long roomTypeId) {
        this.roomTypeId = roomTypeId;
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

    public Boolean getBookable() {
        return bookable;
    }

    public void setBookable(Boolean bookable) {
        this.bookable = bookable;
    }
}
