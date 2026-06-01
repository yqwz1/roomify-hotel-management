package com.roomify.backend.dto;

import java.util.List;

public class ExternalHotelSearchResponse {

    private List<ExternalHotelCardDto> hotels;
    private int totalResults;
    private boolean usingMockData;
    private String source;

    public ExternalHotelSearchResponse() {
    }

    public ExternalHotelSearchResponse(
            List<ExternalHotelCardDto> hotels,
            int totalResults,
            boolean usingMockData,
            String source) {
        this.hotels = hotels;
        this.totalResults = totalResults;
        this.usingMockData = usingMockData;
        this.source = source;
    }

    public List<ExternalHotelCardDto> getHotels() {
        return hotels;
    }

    public void setHotels(List<ExternalHotelCardDto> hotels) {
        this.hotels = hotels;
    }

    public int getTotalResults() {
        return totalResults;
    }

    public void setTotalResults(int totalResults) {
        this.totalResults = totalResults;
    }

    public boolean isUsingMockData() {
        return usingMockData;
    }

    public void setUsingMockData(boolean usingMockData) {
        this.usingMockData = usingMockData;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
