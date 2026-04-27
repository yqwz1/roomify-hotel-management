package com.roomify.backend.dto;

public class InventoryRestockResponse {

    private final InventoryItemResponse item;
    private final InventoryTransactionResponse transaction;
    private final ExpenseResponse linkedExpense;

    public InventoryRestockResponse(
            InventoryItemResponse item,
            InventoryTransactionResponse transaction,
            ExpenseResponse linkedExpense) {
        this.item = item;
        this.transaction = transaction;
        this.linkedExpense = linkedExpense;
    }

    public InventoryItemResponse getItem() {
        return item;
    }

    public InventoryTransactionResponse getTransaction() {
        return transaction;
    }

    public ExpenseResponse getLinkedExpense() {
        return linkedExpense;
    }
}
