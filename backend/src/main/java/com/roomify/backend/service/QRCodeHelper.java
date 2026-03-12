package com.roomify.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;

import javax.imageio.ImageIO;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import org.springframework.stereotype.Component;

@Component
public class QRCodeHelper {

    public byte[] generateQR(String text) {

        try {

            QRCodeWriter writer = new QRCodeWriter();

            BitMatrix matrix = writer.encode(
                    text,
                    BarcodeFormat.QR_CODE,
                    200,
                    200);

            BufferedImage image = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);

            for (int x = 0; x < 200; x++) {
                for (int y = 0; y < 200; y++) {

                    image.setRGB(
                            x,
                            y,
                            matrix.get(x, y) ? 0x000000 : 0xFFFFFF);
                }
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();

            ImageIO.write(image, "PNG", output);

            return output.toByteArray();

        } catch (Exception ex) {
            throw new RuntimeException("QR generation failed", ex);
        }
    }
}