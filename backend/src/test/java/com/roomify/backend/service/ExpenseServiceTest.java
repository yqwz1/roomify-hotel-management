package com.roomify.backend.service;

import com.roomify.backend.dto.ExpenseRequest;
import com.roomify.backend.dto.ExpenseResponse;
import com.roomify.backend.dto.ExpenseSummaryResponse;
import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.entity.PaymentMethod;
import com.roomify.backend.repository.DashboardRepository;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.user.Role;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExpenseServiceTest {

    private ExpenseRepository expenseRepository;
    private DashboardRepository dashboardRepository;
    private UserRepository userRepository;
    private AuditService auditService;
    private ExpenseService expenseService;

    @BeforeEach
    void setUp() {
        expenseRepository = mock(ExpenseRepository.class);
        dashboardRepository = mock(DashboardRepository.class);
        userRepository = mock(UserRepository.class);
        auditService = mock(AuditService.class);

        expenseService = new ExpenseService(
                expenseRepository,
                dashboardRepository,
                userRepository,
                auditService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createExpenseShouldPersistRoundedAmountAndCreatedBy() {
        ExpenseRequest request = buildRequest();
        User user = new User("manager@roomify.com", "hash", Role.MANAGER, true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("manager@roomify.com", null, Collections.emptyList()));

        when(userRepository.findByEmailIgnoreCase("manager@roomify.com")).thenReturn(Optional.of(user));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense saved = invocation.getArgument(0);
            saved.setId(12L);
            saved.setCreatedAt(LocalDateTime.of(2026, 4, 24, 10, 0));
            saved.setUpdatedAt(LocalDateTime.of(2026, 4, 24, 10, 0));
            return saved;
        });

        ExpenseResponse response = expenseService.createExpense(request);

        assertEquals(12L, response.getId());
        assertEquals(new BigDecimal("49.99"), response.getAmount());
        assertEquals("manager@roomify.com", response.getCreatedByEmail());
        verify(auditService).log(any(String.class), any(String.class), any(String.class));
    }

    @Test
    void updateExpenseShouldOverwriteMutableFields() {
        Expense existing = buildExpense(7L, "Old Vendor", ExpenseCategory.CLEANING_SUPPLIES, "30.00");
        ExpenseRequest request = buildRequest();
        request.setVendor("Updated Vendor");
        request.setCategory(ExpenseCategory.CONSUMABLES);
        request.setAmount(new BigDecimal("88.10"));

        when(expenseRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(expenseRepository.save(existing)).thenReturn(existing);

        ExpenseResponse response = expenseService.updateExpense(7L, request);

        assertEquals("Updated Vendor", response.getVendor());
        assertEquals(ExpenseCategory.CONSUMABLES, response.getCategory());
        assertEquals(new BigDecimal("88.10"), response.getAmount());
    }

    @Test
    void deleteExpenseShouldRemoveExpense() {
        Expense existing = buildExpense(9L, "Vendor", ExpenseCategory.EQUIPMENT, "120.00");
        when(expenseRepository.findById(9L)).thenReturn(Optional.of(existing));

        expenseService.deleteExpense(9L);

        verify(expenseRepository).delete(existing);
    }

    @Test
    void getSummaryShouldComputeTotalsBreakdownNetProfitAndRecentExpenses() {
        LocalDate start = LocalDate.of(2026, 4, 1);
        LocalDate end = LocalDate.of(2026, 4, 30);

        Expense expenseOne = buildExpense(1L, "Sparkle Supply", ExpenseCategory.CLEANING_SUPPLIES, "100.00");
        expenseOne.setExpenseDate(LocalDate.of(2026, 4, 20));
        Expense expenseTwo = buildExpense(2L, "Office Depot", ExpenseCategory.CONSUMABLES, "45.50");
        expenseTwo.setExpenseDate(LocalDate.of(2026, 4, 22));
        Expense expenseThree = buildExpense(3L, "Sparkle Supply", ExpenseCategory.CLEANING_SUPPLIES, "20.00");
        expenseThree.setExpenseDate(LocalDate.of(2026, 4, 23));
        expenseThree.setTitle("Mop replacement");

        when(expenseRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(expenseThree, expenseTwo, expenseOne));
        when(expenseRepository.sumAmountInPeriod(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("165.50"));
        when(dashboardRepository.sumRevenueInPeriod(start, end)).thenReturn(new BigDecimal("950.00"));

        ExpenseSummaryResponse summary = expenseService.getSummary(start, end, null, null);

        assertEquals(new BigDecimal("165.50"), summary.getTotalExpenses());
        assertEquals(new BigDecimal("950.00"), summary.getTotalRevenue());
        assertEquals(new BigDecimal("784.50"), summary.getNetProfit());
        assertEquals(3L, summary.getExpenseCount());
        assertEquals(2, summary.getCategoryBreakdown().size());
        assertEquals(ExpenseCategory.CLEANING_SUPPLIES, summary.getCategoryBreakdown().get(0).getCategory());
        assertEquals(new BigDecimal("120.00"), summary.getCategoryBreakdown().get(0).getTotalAmount());
        assertEquals(3, summary.getRecentExpenses().size());
        assertEquals("Mop replacement", summary.getRecentExpenses().get(0).getTitle());
    }

    @Test
    void listExpensesShouldRejectHalfOpenDateRange() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.listExpenses(LocalDate.of(2026, 4, 1), null, null, null));

        assertEquals("Both start date and end date are required when filtering expenses", exception.getMessage());
        verify(expenseRepository, never()).findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class));
    }

    @Test
    void getSummaryShouldRejectInvalidRange() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> expenseService.getSummary(LocalDate.of(2026, 4, 30), LocalDate.of(2026, 4, 1), null, null));

        assertTrue(exception.getMessage().contains("End date cannot be before start date"));
    }

    private ExpenseRequest buildRequest() {
        ExpenseRequest request = new ExpenseRequest();
        request.setTitle("Cleaning detergent");
        request.setDescription("Lobby and room cleaning");
        request.setCategory(ExpenseCategory.CLEANING_SUPPLIES);
        request.setAmount(new BigDecimal("49.994"));
        request.setExpenseDate(LocalDate.of(2026, 4, 24));
        request.setVendor("Sparkle Supply");
        request.setPaymentMethod(PaymentMethod.CARD);
        request.setRecurring(false);
        request.setReceiptFileName("receipt-49.pdf");
        request.setReceiptFileUrl("https://files.example/receipt-49.pdf");
        return request;
    }

    private Expense buildExpense(Long id, String vendor, ExpenseCategory category, String amount) {
        Expense expense = new Expense();
        expense.setId(id);
        expense.setTitle("Expense " + id);
        expense.setDescription("Expense description");
        expense.setCategory(category);
        expense.setAmount(new BigDecimal(amount));
        expense.setExpenseDate(LocalDate.of(2026, 4, 10));
        expense.setVendor(vendor);
        expense.setPaymentMethod(PaymentMethod.CARD);
        expense.setCreatedAt(LocalDateTime.of(2026, 4, 10, 9, 0));
        expense.setUpdatedAt(LocalDateTime.of(2026, 4, 10, 9, 0));
        return expense;
    }
}
