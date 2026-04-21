package com.roomify.backend.dto;

import com.roomify.backend.entity.RoomStatus;

/**
 * Response DTO for Room entity.
 */
public class RoomResponse {

    private Long id;
    private String roomNumber;
    private RoomTypeResponse roomType;
    private Integer floor;
    private RoomStatus status;
    private String displayName;
    private String primaryPhotoUrl;
    private String galleryPhotoUrls;
    private String bedType;
    private String viewType;
    private Integer sizeSquareMeters;
    private String featuredNote;
    private String customAmenities;
    private boolean bookable;

    // Constructors
    public RoomResponse() {}

    public RoomResponse(Long id, String roomNumber, RoomTypeResponse roomType, Integer floor, RoomStatus status) {
        this.id = id;
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

    public RoomTypeResponse getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomTypeResponse roomType) {
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
