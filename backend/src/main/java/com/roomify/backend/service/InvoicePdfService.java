package com.roomify.backend.service;

import com.roomify.backend.entity.Reservation;

import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.*;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.HorizontalAlignment;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {

        private final QRCodeHelper qrCodeHelper;

        public byte[] generateInvoice(Reservation reservation) {

                try {

                        ByteArrayOutputStream output = new ByteArrayOutputStream();

                        PdfWriter writer = new PdfWriter(output);
                        PdfDocument pdf = new PdfDocument(writer);
                        Document document = new Document(pdf);

                        document.add(new Paragraph("ROOMIFY HOTEL")
                                        .setFontSize(20)
                                        .setBold());

                        document.add(new Paragraph("Invoice"));

                        document.add(new Paragraph(" "));

                        document.add(new Paragraph(
                                        "Guest: " + reservation.getGuest().getName()));

                        document.add(new Paragraph(
                                        "Email: " + reservation.getGuest().getEmail()));

                        document.add(new Paragraph(
                                        "Confirmation: " + reservation.getConfirmationNumber()));

                        document.add(new Paragraph(" "));

                        Table table = new Table(4);

                        table.addHeaderCell("Room");
                        table.addHeaderCell("Check-in");
                        table.addHeaderCell("Check-out");
                        table.addHeaderCell("Total");

                        table.addCell(reservation.getRoom().getRoomNumber());
                        table.addCell(reservation.getCheckInDate().toString());
                        table.addCell(reservation.getCheckOutDate().toString());
                        table.addCell(reservation.getTotalPrice().toString());

                        document.add(table);

                        document.add(new Paragraph(" "));

                        byte[] qr = qrCodeHelper.generateQR(
                                        reservation.getConfirmationNumber());

                        Image qrImage = new Image(
                                        com.itextpdf.io.image.ImageDataFactory.create(qr));

                        qrImage.setWidth(120);

                        document.add(new Paragraph("Scan for reservation verification"));
                        document.add(qrImage);

                        document.close();

                        return output.toByteArray();

                } catch (Exception ex) {
                        throw new RuntimeException("Invoice PDF generation failed", ex);
                }
        }
}