package com.roomify.backend.service;

import com.roomify.backend.entity.Reservation;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.*;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {

        private final QRCodeHelper qrCodeHelper;
        private final ZatcaQrService zatcaQrService;
        private final ReservationFinancialService financialService;

        @Value("${roomify.billing.vat-rate}")
        private BigDecimal vatRate;

        @Value("${roomify.invoice.seller-name:Roomify Hotel}")
        private String sellerName;

        @Value("${roomify.invoice.seller-vat-number:1234567890}")
        private String sellerVatNumber;

        public byte[] generateInvoice(
                        Reservation reservation,
                        String invoiceNumber) {

                try {
                        ReservationFinancialService.ReservationFinancialSummary summary = financialService.summarize(reservation);

                        ByteArrayOutputStream output = new ByteArrayOutputStream();

                        PdfWriter writer = new PdfWriter(output);
                        PdfDocument pdf = new PdfDocument(writer);
                        Document document = new Document(pdf);

                        // ======================
                        // HEADER
                        // ======================

                        document.add(new Paragraph("ROOMIFY HOTEL")
                                        .setBold()
                                        .setFontSize(22)
                                        .setTextAlignment(TextAlignment.CENTER));

                        document.add(new Paragraph("Hotel Invoice")
                                        .setTextAlignment(TextAlignment.CENTER));

                        document.add(new Paragraph(" "));

                        // ======================
                        // Invoice Info
                        // ======================

                        String now = LocalDateTime.now()
                                        .format(DateTimeFormatter.ISO_DATE_TIME);

                        document.add(new Paragraph("Invoice Number: " + invoiceNumber));
                        document.add(new Paragraph("Date: " + now));

                        document.add(new Paragraph(" "));

                        // ======================
                        // Guest Info
                        // ======================

                        document.add(new Paragraph("Guest Information").setBold());

                        String guestName = reservation.getGuest() != null
                                        ? reservation.getGuest().getName()
                                        : "Unknown";

                        String guestEmail = reservation.getGuest() != null
                                        ? reservation.getGuest().getEmail()
                                        : "N/A";

                        document.add(new Paragraph("Guest: " + guestName));
                        document.add(new Paragraph("Email: " + guestEmail));
                        document.add(new Paragraph("Confirmation: "
                                        + reservation.getConfirmationNumber()));

                        document.add(new Paragraph(" "));

                        // ======================
                        // Reservation Table
                        // ======================

                        float[] columns = { 3, 3, 3, 3 };

                        Table table = new Table(columns);

                        table.addHeaderCell(headerCell("Room"));
                        table.addHeaderCell(headerCell("Check In"));
                        table.addHeaderCell(headerCell("Check Out"));
                        table.addHeaderCell(headerCell("Price (SAR)"));

                        table.addCell(reservation.getRoom().getRoomNumber());
                        table.addCell(reservation.getCheckInDate().toString());
                        table.addCell(reservation.getCheckOutDate().toString());
                        table.addCell(formatMoney(summary.totalPrice()));

                        document.add(table);

                        document.add(new Paragraph(" "));

                        // ======================
                        // VAT Calculation
                        // ======================

                        BigDecimal subtotal = summary.subtotal();
                        BigDecimal vat = summary.taxes();
                        BigDecimal total = summary.totalPrice();

                        Table totals = new Table(2);

                        totals.addCell("Subtotal");
                        totals.addCell(formatMoney(subtotal));

                        totals.addCell("VAT " + vatRate.multiply(new BigDecimal("100")) + "%");
                        totals.addCell(formatMoney(vat));

                        totals.addCell("Total");
                        totals.addCell(formatMoney(total));

                        document.add(totals);

                        document.add(new Paragraph(" "));

                        // ======================
                        // ZATCA QR
                        // ======================

                        // ZATCA Tag 3 requires a timezone-aware ISO-8601 instant.
                        // Use KSA local time (+03:00) truncated to whole seconds.
                        String qrTimestamp = OffsetDateTime.now(ZoneOffset.ofHours(3))
                                        .truncatedTo(ChronoUnit.SECONDS)
                                        .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

                        String payload = zatcaQrService.generateQrPayload(
                                        sellerName,
                                        sellerVatNumber,
                                        qrTimestamp,
                                        total.toString(),
                                        vat.toString());

                        byte[] qr = qrCodeHelper.generateQR(payload);

                        Image qrImage = new Image(
                                        com.itextpdf.io.image.ImageDataFactory.create(qr));

                        qrImage.setWidth(140);

                        document.add(new Paragraph("ZATCA QR Code").setBold());
                        document.add(qrImage);

                        document.add(new Paragraph(" "));

                        // ======================
                        // Footer
                        // ======================

                        document.add(new Paragraph("Thank you for staying with Roomify Hotel")
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setFontSize(10));

                        document.close();

                        return output.toByteArray();

                } catch (Exception ex) {
                        throw new RuntimeException("Invoice PDF generation failed", ex);
                }
        }

        private Cell headerCell(String text) {
                return new Cell()
                                .add(new Paragraph(text))
                                .setBold()
                                .setBackgroundColor(ColorConstants.LIGHT_GRAY);
        }

        private String formatMoney(BigDecimal value) {
                return "SAR " + value;
        }
}
