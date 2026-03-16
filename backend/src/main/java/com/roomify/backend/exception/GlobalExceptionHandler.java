package com.roomify.backend.exception;

import com.roomify.backend.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

        // 1. معالجة أخطاء الإدخال (Validation) - يرجع ApiError موحد
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiError> handleValidationErrors(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {

                // تجميع الأخطاء في Map
                Map<String, String> validationErrors = new HashMap<>();
                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> validationErrors.put(error.getField(), error.getDefaultMessage()));
                ex.getBindingResult().getGlobalErrors()
                                .forEach(error -> validationErrors.putIfAbsent(
                                                resolveGlobalErrorKey(error),
                                                error.getDefaultMessage()));

                // نرجع ApiError يحتوي على الماب، عشان نوحد الشكل
                ApiError error = new ApiError(
                                HttpStatus.BAD_REQUEST.value(),
                                "Validation Error",
                                "Input validation failed",
                                request.getRequestURI(),
                                validationErrors // مررنا الماب هنا
                );

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

        // 2. معالجة 403 Forbidden - المستخدم مصادق عليه لكن ما عنده صلاحية
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

        // 3. معالجة 401 Unauthorized - فشل في المصادقة أو التوكن غير صحيح
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

        // 4. معالجة 500 Internal Server Error - أخطاء عامة غير متوقعة
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

        // Invalid room status transition (e.g. OCCUPIED → AVAILABLE) → 422
        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ApiError> handleIllegalState(
                        IllegalStateException ex,
                        HttpServletRequest request) {
                // Use numeric 422 to avoid Spring 7 HttpStatus.UNPROCESSABLE_ENTITY deprecation
                int code = 422;
                ApiError error = new ApiError(
                                code,
                                "Unprocessable Entity",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(code).body(error);
        }
}
