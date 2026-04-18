package com.roomify.backend.exception;

import com.roomify.backend.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.ObjectError;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiError> handleValidationErrors(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {

                Map<String, String> validationErrors = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> validationErrors.put(error.getField(), error.getDefaultMessage()));
                ex.getBindingResult().getGlobalErrors()
                                .forEach(error -> validationErrors.putIfAbsent(
                                                resolveGlobalErrorKey(error),
                                                error.getDefaultMessage()));

                ApiError error = new ApiError(
                                HttpStatus.BAD_REQUEST.value(),
                                "Validation Error",
                                "Input validation failed",
                                request.getRequestURI(),
                                validationErrors);

                return ResponseEntity.badRequest().body(error);
        }

        @ExceptionHandler(BindException.class)
        public ResponseEntity<ApiError> handleBindException(
                        BindException ex,
                        HttpServletRequest request) {

                Map<String, String> validationErrors = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> validationErrors.put(error.getField(), error.getDefaultMessage()));

                ApiError error = new ApiError(
                                HttpStatus.BAD_REQUEST.value(),
                                "Validation Error",
                                "Input validation failed",
                                request.getRequestURI(),
                                validationErrors);

                return ResponseEntity.badRequest().body(error);
        }

        private String resolveGlobalErrorKey(ObjectError error) {
                String[] codes = error.getCodes();
                if (codes != null) {
                        for (String code : codes) {
                                String[] parts = code.split("\\.");
                                if (parts.length >= 2) {
                                        String candidate = parts[parts.length - 1];
                                        if (!candidate.equals(error.getObjectName())
                                                        && !candidate.equals(error.getCode())
                                                        && !"java.lang.Boolean".equals(candidate)) {
                                                return candidate;
                                        }
                                }
                        }
                }
                return error.getObjectName();
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiError> handleAccessDenied(
                        AccessDeniedException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.FORBIDDEN.value(),
                                "Forbidden",
                                "You do not have permission to access this resource",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiError> handleAuthenticationException(
                        AuthenticationException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                ex.getMessage() != null ? ex.getMessage() : "Authentication failed",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiError> handleNotFound(
                        ResourceNotFoundException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.NOT_FOUND.value(),
                                "Not Found",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(PaymentValidationException.class)
        public ResponseEntity<ApiError> handlePaymentValidation(
                        PaymentValidationException ex,
                        HttpServletRequest request) {
                Map<String, Object> details = new HashMap<>();
                details.put("paymentStatus", ex.getPaymentStatus());
                details.put("outstandingBalance", ex.getOutstandingBalance());
                details.put("invoiceFinalized", ex.isInvoiceFinalized());

                ApiError error = new ApiError(
                                HttpStatus.CONFLICT.value(),
                                "Payment Required",
                                ex.getMessage(),
                                request.getRequestURI(),
                                ex.getCode(),
                                details);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(ResourceConflictException.class)
        public ResponseEntity<ApiError> handleConflict(
                        ResourceConflictException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(EmailDeliveryException.class)
        public ResponseEntity<ApiError> handleEmailDelivery(
                        EmailDeliveryException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.SERVICE_UNAVAILABLE.value(),
                                "Service Unavailable",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }

        @ExceptionHandler(DuplicateResourceException.class)
        public ResponseEntity<ApiError> handleDuplicateResource(
                        DuplicateResourceException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(CannotDeleteException.class)
        public ResponseEntity<ApiError> handleCannotDelete(
                        CannotDeleteException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiError> handleIllegalArgument(
                        IllegalArgumentException ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.badRequest().body(error);
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiError> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        HttpServletRequest request) {
                String message = "Invalid value for parameter: " + ex.getName();
                if (ex.getValue() != null) {
                        message += " (" + ex.getValue() + ")";
                }

                ApiError error = new ApiError(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                message,
                                request.getRequestURI());
                return ResponseEntity.badRequest().body(error);
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ApiError> handleIllegalState(
                        IllegalStateException ex,
                        HttpServletRequest request) {
                int code = 422;
                ApiError error = new ApiError(
                                code,
                                "Unprocessable Entity",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(code).body(error);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiError> handleGeneralError(
                        Exception ex,
                        HttpServletRequest request) {
                ApiError error = new ApiError(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal Server Error",
                                "An unexpected error occurred: " + ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
}
