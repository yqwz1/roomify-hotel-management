package com.roomify.backend.dto;

import com.roomify.backend.entity.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ExpenseSummaryResponse {

    private final LocalDate startDate;
    private final LocalDate endDate;
    private final ExpenseCategory categoryFilter;
    private final String vendorFilter;
    private final BigDecimal totalRevenue;
    private final BigDecimal totalExpenses;
    private final BigDecimal netProfit;
    private final BigDecimal expensesToday;
    private final BigDecimal expensesThisWeek;
    private final BigDecimal expensesThisMonth;
    private final long expenseCount;
    private final List<ExpenseCategoryBreakdownItem> categoryBreakdown;
    private final List<ExpenseResponse> recentExpenses;

    public ExpenseSummaryResponse(
            LocalDate startDate,
            LocalDate endDate,
            ExpenseCategory categoryFilter,
            String vendorFilter,
            BigDecimal totalRevenue,
            BigDecimal totalExpenses,
            BigDecimal netProfit,
            BigDecimal expensesToday,
            BigDecimal expensesThisWeek,
            BigDecimal expensesThisMonth,
            long expenseCount,
            List<ExpenseCategoryBreakdownItem> categoryBreakdown,
            List<ExpenseResponse> recentExpenses) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.categoryFilter = categoryFilter;
        this.vendorFilter = vendorFilter;
        this.totalRevenue = totalRevenue;
        this.totalExpenses = totalExpenses;
        this.netProfit = netProfit;
        this.expensesToday = expensesToday;
        this.expensesThisWeek = expensesThisWeek;
        this.expensesThisMonth = expensesThisMonth;
        this.expenseCount = expenseCount;
        this.categoryBreakdown = categoryBreakdown;
        this.recentExpenses = recentExpenses;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public ExpenseCategory getCategoryFilter() {
        return categoryFilter;
    }

    public String getVendorFilter() {
        return vendorFilter;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public BigDecimal getNetProfit() {
        return netProfit;
    }

    public BigDecimal getExpensesToday() {
        return expensesToday;
    }

    public BigDecimal getExpensesThisWeek() {
        return expensesThisWeek;
    }

    public BigDecimal getExpensesThisMonth() {
        return expensesThisMonth;
    }

    public long getExpenseCount() {
        return expenseCount;
    }

    public List<ExpenseCategoryBreakdownItem> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public List<ExpenseResponse> getRecentExpenses() {
        return recentExpenses;
    }
}
