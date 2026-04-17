package com.roomify.backend.dto;

import java.util.List;

public class GuestReservationsResponse {

    private List<GuestReservationSummaryDto> reservations;

    public GuestReservationsResponse() {
    }

    public GuestReservationsResponse(List<GuestReservationSummaryDto> reservations) {
        this.reservations = reservations;
    }

    public List<GuestReservationSummaryDto> getReservations() {
        return reservations;
    }

    public void setReservations(List<GuestReservationSummaryDto> reservations) {
        this.reservations = reservations;
    }
}