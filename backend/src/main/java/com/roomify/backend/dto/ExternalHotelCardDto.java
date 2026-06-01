package com.roomify.backend.dto;

public class ExternalHotelCardDto {

    private String placeId;
    private String name;
    private String address;
    private Double rating;
    private Integer userRatingCount;
    private String photoName;
    private String googleMapsUri;
    private String source;
    private boolean mock;

    public ExternalHotelCardDto() {
    }

    public ExternalHotelCardDto(
            String placeId,
            String name,
            String address,
            Double rating,
            Integer userRatingCount,
            String photoName,
            String googleMapsUri,
            String source,
            boolean mock) {
        this.placeId = placeId;
        this.name = name;
        this.address = address;
        this.rating = rating;
        this.userRatingCount = userRatingCount;
        this.photoName = photoName;
        this.googleMapsUri = googleMapsUri;
        this.source = source;
        this.mock = mock;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getUserRatingCount() {
        return userRatingCount;
    }

    public void setUserRatingCount(Integer userRatingCount) {
        this.userRatingCount = userRatingCount;
    }

    public String getPhotoName() {
        return photoName;
    }

    public void setPhotoName(String photoName) {
        this.photoName = photoName;
    }

    public String getGoogleMapsUri() {
        return googleMapsUri;
    }

    public void setGoogleMapsUri(String googleMapsUri) {
        this.googleMapsUri = googleMapsUri;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public boolean isMock() {
        return mock;
    }

    public void setMock(boolean mock) {
        this.mock = mock;
    }
}
