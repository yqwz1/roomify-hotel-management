package com.roomify.backend.exception;

/**
 * Exception thrown when attempting to delete a resource that has dependencies.
 * For example, deleting a RoomType that has rooms assigned to it.
 */
public class CannotDeleteException extends RuntimeException {
    
    public CannotDeleteException(String message) {
        super(message);
    }
}
