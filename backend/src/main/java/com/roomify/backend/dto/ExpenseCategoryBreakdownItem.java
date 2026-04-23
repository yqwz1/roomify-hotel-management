package com.roomify.backend.dto;

import com.roomify.backend.entity.ExpenseCategory;

import java.math.BigDecimal;

public class ExpenseCategoryBreakdownItem {

    private final ExpenseCategory category;
    private final BigDecimal totalAmount;
    private final long expenseCount;

    public ExpenseCategoryBreakdownItem(ExpenseCategory category, BigDecimal totalAmount, long expenseCount) {
        this.category = category;
        this.totalAmount = totalAmount;
        this.expenseCount = expenseCount;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public long getExpenseCount() {
        return expenseCount;
    }
}
