package com.roomify.backend.service;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

@Component
public class BookingUtils {

    
    public boolean isOverlapping(LocalDate newStart, LocalDate newEnd, LocalDate existingStart, LocalDate existingEnd) {
        if (newStart == null || newEnd == null || existingStart == null || existingEnd == null) {
            return false;
        }
        return newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);
    }
}