String paymentStatus = PaymentStatusResolver.resolve(
        totalPaid,
        outstandingBalance,
        reservation.isInvoiceFinalized());