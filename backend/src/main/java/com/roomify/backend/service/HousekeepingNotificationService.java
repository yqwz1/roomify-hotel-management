package com.roomify.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HousekeepingNotificationService {

    private static final Logger log =
            LoggerFactory.getLogger(HousekeepingNotificationService.class);

    /**
     * Checkout alert routing for housekeeping.
     */
    public void notifyCheckoutNeedsCleaning(String roomNumber) {

        log.info("HOUSEKEEPING_ROUTING: checkout alert sent for room {}", roomNumber);

        System.out.println(
                "Housekeeping alert: Room "
                        + roomNumber
                        + " needs cleaning after checkout");
    }

    /**
     * Room is ready again after cleaning.
     */
    public void notifyRoomReady(String roomNumber) {

        log.info("HOUSEKEEPING_ROUTING: room ready alert sent for room {}", roomNumber);

        System.out.println(
                "Housekeeping update: Room "
                        + roomNumber
                        + " is now available");
    }
}