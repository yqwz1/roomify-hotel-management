package com.roomify.backend.repository;

import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public final class ExpenseSpecification {

    private ExpenseSpecification() {
    }

    public static Specification<Expense> build(
            LocalDate startDate,
            LocalDate endDate,
            ExpenseCategory category,
            String vendor) {
        return Specification.allOf(
                dateOnOrAfter(startDate),
                dateOnOrBefore(endDate),
                hasCategory(category),
                vendorContains(vendor));
    }

    private static Specification<Expense> dateOnOrAfter(LocalDate startDate) {
        return (root, query, cb) ->
                startDate == null ? null : cb.greaterThanOrEqualTo(root.get("expenseDate"), startDate);
    }

    private static Specification<Expense> dateOnOrBefore(LocalDate endDate) {
        return (root, query, cb) ->
                endDate == null ? null : cb.lessThanOrEqualTo(root.get("expenseDate"), endDate);
    }

    private static Specification<Expense> hasCategory(ExpenseCategory category) {
        return (root, query, cb) ->
                category == null ? null : cb.equal(root.get("category"), category);
    }

    private static Specification<Expense> vendorContains(String vendor) {
        return (root, query, cb) -> {
            if (vendor == null || vendor.isBlank()) {
                return null;
            }
            return cb.like(
                    cb.lower(root.get("vendor")),
                    "%" + vendor.trim().toLowerCase() + "%");
        };
    }
}
