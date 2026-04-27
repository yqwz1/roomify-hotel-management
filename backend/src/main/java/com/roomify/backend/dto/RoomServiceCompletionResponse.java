package com.roomify.backend.dto;

import java.util.List;

public class RoomServiceCompletionResponse {

    private final RoomResponse room;
    private final ServiceUsageRecordResponse usageRecord;
    private final List<String> warnings;

    public RoomServiceCompletionResponse(
            RoomResponse room,
            ServiceUsageRecordResponse usageRecord,
            List<String> warnings) {
        this.room = room;
        this.usageRecord = usageRecord;
        this.warnings = warnings;
    }

    public RoomResponse getRoom() {
        return room;
    }

    public ServiceUsageRecordResponse getUsageRecord() {
        return usageRecord;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
