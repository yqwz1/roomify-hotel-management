package com.roomify.backend.controller;

import com.roomify.backend.dto.ExternalHotelDetailsResponse;
import com.roomify.backend.dto.ExternalHotelSearchResponse;
import com.roomify.backend.service.GooglePlacesService;
import com.roomify.backend.service.GooglePlacesService.PhotoResult;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/external-hotels")
public class ExternalHotelController {

    private final GooglePlacesService googlePlacesService;

    public ExternalHotelController(GooglePlacesService googlePlacesService) {
        this.googlePlacesService = googlePlacesService;
    }

    @GetMapping("/search")
    public ExternalHotelSearchResponse search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return googlePlacesService.search(query, city, lat, lng);
    }

    @GetMapping("/{placeId}")
    public ExternalHotelDetailsResponse details(@PathVariable String placeId) {
        return googlePlacesService.details(placeId);
    }

    @GetMapping("/{placeId}/photo")
    public ResponseEntity<byte[]> photo(
            @PathVariable String placeId,
            @RequestParam String photoName) {
        PhotoResult photo = googlePlacesService.photo(photoName);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_TYPE, photo.contentType())
                .body(photo.bytes());
    }
}
