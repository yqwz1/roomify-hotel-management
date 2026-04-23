package com.roomify.backend.service;

import com.roomify.backend.dto.ExpenseCategoryBreakdownItem;
import com.roomify.backend.dto.ExpenseRequest;
import com.roomify.backend.dto.ExpenseResponse;
import com.roomify.backend.dto.ExpenseSummaryResponse;
import com.roomify.backend.entity.Expense;
import com.roomify.backend.entity.ExpenseCategory;
import com.roomify.backend.repository.DashboardRepository;
import com.roomify.backend.repository.ExpenseRepository;
import com.roomify.backend.repository.ExpenseSpecification;
import com.roomify.backend.user.User;
import com.roomify.backend.user.UserRepository;
import com.roomify.backend.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExpenseService {

    private static final Sort EXPENSE_SORT = Sort.by(
            Sort.Order.desc("expenseDate"),
            Sort.Order.desc("createdAt"));

    private final ExpenseRepository expenseRepository;
    private final DashboardRepository dashboardRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            DashboardRepository dashboardRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.expenseRepository = expenseRepository;
        this.dashboardRepository = dashboardRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(
            LocalDate startDate,
            LocalDate endDate,
            ExpenseCategory category,
            String vendor) {
        validateRange(startDate, endDate);
        Specification<Expense> specification = ExpenseSpecification.build(startDate, endDate, category, vendor);
        return expenseRepository.findAll(specification, EXPENSE_SORT).stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(Long id) {
        return ExpenseResponse.from(findExpense(id));
    }

    public ExpenseResponse createExpense(ExpenseRequest request) {
        Expense expense = new Expense();
        applyRequest(expense, request);
        resolveCurrentUser().ifPresent(expense::setCreatedBy);

        Expense saved = expenseRepository.save(expense);
        auditService.log(
                "EXPENSE_CREATED",
                "Expense:" + saved.getId(),
                "{\"title\":\"" + saved.getTitle() + "\",\"amount\":\"" + saved.getAmount() + "\"}");
        return ExpenseResponse.from(saved);
    }

    public ExpenseResponse updateExpense(Long id, ExpenseRequest request) {
        Expense expense = findExpense(id);
        applyRequest(expense, request);

        Expense saved = expenseRepository.save(expense);
        auditService.log(
                "EXPENSE_UPDATED",
                "Expense:" + saved.getId(),
                "{\"title\":\"" + saved.getTitle() + "\",\"amount\":\"" + saved.getAmount() + "\"}");
        return ExpenseResponse.from(saved);
    }

    public void deleteExpense(Long id) {
        Expense expense = findExpense(id);
        expenseRepository.delete(expense);
        auditService.log(
                "EXPENSE_DELETED",
                "Expense:" + id,
                "{\"title\":\"" + expense.getTitle() + "\",\"amount\":\"" + expense.getAmount() + "\"}");
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryResponse getSummary(
            LocalDate startDate,
            LocalDate endDate,
            ExpenseCategory category,
            String vendor) {
        LocalDate resolvedStartDate = startDate;
        LocalDate resolvedEndDate = endDate;
        if (resolvedStartDate == null && resolvedEndDate == null) {
            resolvedEndDate = LocalDate.now();
            resolvedStartDate = resolvedEndDate.withDayOfMonth(1);
        }
        validateRange(resolvedStartDate, resolvedEndDate);

        Specification<Expense> specification = ExpenseSpecification.build(
                resolvedStartDate, resolvedEndDate, category, vendor);
        List<Expense> expenses = expenseRepository.findAll(specification, EXPENSE_SORT);

        BigDecimal totalExpenses = sumExpenses(expenses.stream()
                .map(Expense::getAmount)
                .toList());
        BigDecimal totalRevenue = money(dashboardRepository.sumRevenueInPeriod(resolvedStartDate, resolvedEndDate));
        BigDecimal netProfit = money(totalRevenue.subtract(totalExpenses));

        Map<ExpenseCategory, List<Expense>> grouped = expenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory));

        List<ExpenseCategoryBreakdownItem> categoryBreakdown = grouped.entrySet().stream()
                .map(entry -> new ExpenseCategoryBreakdownItem(
                        entry.getKey(),
                        sumExpenses(entry.getValue().stream().map(Expense::getAmount).toList()),
                        entry.getValue().size()))
                .sorted(Comparator.comparing(ExpenseCategoryBreakdownItem::getTotalAmount).reversed())
                .toList();

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate monthStart = today.withDayOfMonth(1);

        return new ExpenseSummaryResponse(
                resolvedStartDate,
                resolvedEndDate,
                category,
                normalize(vendor),
                totalRevenue,
                totalExpenses,
                netProfit,
                sumPeriod(today, today),
                sumPeriod(weekStart, today),
                sumPeriod(monthStart, today),
                expenses.size(),
                categoryBreakdown,
                expenses.stream().limit(5).map(ExpenseResponse::from).toList());
    }

    private Expense findExpense(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
    }

    private void applyRequest(Expense expense, ExpenseRequest request) {
        expense.setTitle(request.getTitle().trim());
        expense.setDescription(normalize(request.getDescription()));
        expense.setCategory(request.getCategory());
        expense.setAmount(money(request.getAmount()));
        expense.setExpenseDate(request.getExpenseDate());
        expense.setVendor(normalize(request.getVendor()));
        expense.setPaymentMethod(request.getPaymentMethod());
        expense.setRecurring(request.isRecurring());
        expense.setReceiptFileName(normalize(request.getReceiptFileName()));
        expense.setReceiptFileUrl(normalize(request.getReceiptFileUrl()));
    }

    private Optional<User> resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName());
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if ((startDate == null) != (endDate == null)) {
            throw new IllegalArgumentException("Both start date and end date are required when filtering expenses");
        }
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
    }

    private BigDecimal sumPeriod(LocalDate startDate, LocalDate endDate) {
        return money(expenseRepository.sumAmountInPeriod(startDate, endDate));
    }

    private BigDecimal sumExpenses(List<BigDecimal> amounts) {
        return money(amounts.stream()
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
