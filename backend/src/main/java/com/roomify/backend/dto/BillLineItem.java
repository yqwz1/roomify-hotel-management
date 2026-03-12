package com.roomify.backend.dto;

import java.math.BigDecimal;

public class BillLineItem {

    private String description;
    private BigDecimal amount;
    private boolean isCredit;

    public BillLineItem() {
    }

    public BillLineItem(String description, BigDecimal amount, boolean isCredit) {
        this.description = description;
        this.amount = amount;
        this.isCredit = isCredit;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public boolean isCredit() {
        return isCredit;
    }

    public void setCredit(boolean credit) {
        isCredit = credit;
    }
}
