package com.roomify.backend.dto;

import jakarta.validation.constraints.Size;

public class MockRefundRequest {

    @Size(max = 500, message = "Refund reason cannot exceed 500 characters")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
