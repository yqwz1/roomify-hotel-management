package com.roomify.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomify.backend.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    boolean existsByInvoiceNumber(String invoiceNumber);
}