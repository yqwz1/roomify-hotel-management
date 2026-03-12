package com.roomify.backend.dto;

import java.math.BigDecimal;

/**
 * A single line on the itemised bill rendered to the frontend.
 */
public class BillLineItem {

    private String label;
    private BigDecimal amount;
    private boolean credit;

    public BillLineItem() {
    }

    public BillLineItem(String label, BigDecimal amount, boolean credit) {
        this.label = label;
        this.amount = amount;
        this.credit = credit;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public boolean isCredit() {
        return credit;
    }

    public void setCredit(boolean credit) {
        this.credit = credit;
    }
}
