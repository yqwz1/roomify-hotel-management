package com.roomify.backend.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class ZatcaQrService {

    public String generateQrPayload(
            String sellerName,
            String vatNumber,
            String timestamp,
            String total,
            String vat) {

        try {

            StringBuilder tlv = new StringBuilder();

            tlv.append(buildField(1, sellerName));
            tlv.append(buildField(2, vatNumber));
            tlv.append(buildField(3, timestamp));
            tlv.append(buildField(4, total));
            tlv.append(buildField(5, vat));

            return Base64.getEncoder()
                    .encodeToString(tlv.toString().getBytes(StandardCharsets.UTF_8));

        } catch (Exception ex) {
            throw new RuntimeException("ZATCA QR generation failed", ex);
        }
    }

    private String buildField(int tag, String value) {

        int byteLength = value.getBytes(StandardCharsets.UTF_8).length;

        return (char) tag +
                String.valueOf((char) byteLength) +
                value;
    }
}