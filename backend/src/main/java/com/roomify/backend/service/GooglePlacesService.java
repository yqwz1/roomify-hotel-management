package com.roomify.backend.service;

import com.roomify.backend.config.GooglePlacesProperties;
import com.roomify.backend.dto.ExternalHotelCardDto;
import com.roomify.backend.dto.ExternalHotelDetailsResponse;
import com.roomify.backend.dto.ExternalHotelSearchResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

@Service
public class GooglePlacesService {

    public static final String SOURCE_GOOGLE_MAPS = "GOOGLE_MAPS";

    /*
     * The search FieldMask is intentionally limited to card-level data to reduce
     * Places API cost. Reviews are excluded here and requested only in details.
     */
    private static final String SEARCH_FIELD_MASK = String.join(",",
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.photos",
            "places.googleMapsUri");

    /*
     * Demo key mode avoids user-generated photos while preserving basic Places
     * discovery data supported by the free Maps demo key.
     */
    private static final String DEMO_SEARCH_FIELD_MASK = String.join(",",
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.googleMapsUri");

    /*
     * Reviews are requested only from the detail endpoint because they are more
     * expensive and are not needed for the initial discovery grid.
     */
    private static final String DETAILS_FIELD_MASK = String.join(",",
            "id",
            "displayName",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "photos",
            "googleMapsUri",
            "reviews",
            "location",
            "websiteUri",
            "internationalPhoneNumber");

    /*
     * Demo key mode does not request reviews or user-submitted photos. Users can
     * open Google Maps for reviews instead of rendering that content in Roomify.
     */
    private static final String DEMO_DETAILS_FIELD_MASK = String.join(",",
            "id",
            "displayName",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "googleMapsUri",
            "location",
            "websiteUri",
            "internationalPhoneNumber");

    private final GooglePlacesProperties properties;
    private final ExternalHotelCacheService cacheService;
    private final RestClient placesClient;
    private final RestClient genericClient;

    public GooglePlacesService(GooglePlacesProperties properties, ExternalHotelCacheService cacheService) {
        this.properties = properties;
        this.cacheService = cacheService;
        this.placesClient = RestClient.builder()
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .build();
        this.genericClient = RestClient.builder().build();
    }

    public ExternalHotelSearchResponse search(String query, String city, Double lat, Double lng) {
        if (!properties.hasApiKey()) {
            return mockSearch();
        }

        String cacheKey = "search:%s:%s:%s:%s:%s".formatted(
                properties.isDemoKeyMode(),
                normalize(query),
                normalize(city),
                Objects.toString(lat, ""),
                Objects.toString(lng, ""));
        return cacheService.get(cacheKey, ExternalHotelSearchResponse.class)
                .orElseGet(() -> {
                    ExternalHotelSearchResponse response = fetchSearch(query, city, lat, lng);
                    cacheService.put(cacheKey, response, ttl());
                    return response;
                });
    }

    public ExternalHotelDetailsResponse details(String placeId) {
        if (!properties.hasApiKey() || isMockPlace(placeId)) {
            return mockDetails(placeId);
        }

        String cacheKey = "details:%s:%s".formatted(properties.isDemoKeyMode(), placeId);
        return cacheService.get(cacheKey, ExternalHotelDetailsResponse.class)
                .orElseGet(() -> {
                    ExternalHotelDetailsResponse response = fetchDetails(placeId);
                    cacheService.put(cacheKey, response, ttl());
                    return response;
                });
    }

    public PhotoResult photo(String photoName) {
        if (!properties.hasApiKey() || properties.isDemoKeyMode() || photoName == null
                || photoName.startsWith("mock:") || photoName.startsWith("curated:")) {
            return placeholderPhoto();
        }

        String cacheKey = "photo:%s".formatted(photoName);
        return cacheService.get(cacheKey, PhotoResult.class)
                .orElseGet(() -> {
                    PhotoResult result = fetchPhoto(photoName);
                    cacheService.put(cacheKey, result, ttl());
                    return result;
                });
    }

    private ExternalHotelSearchResponse fetchSearch(String query, String city, Double lat, Double lng) {
        try {
            JsonNode body = placesClient.post()
                    .uri("/places:searchText")
                    .header("X-Goog-Api-Key", properties.getApiKey())
                    .header("X-Goog-FieldMask", searchFieldMask())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(buildSearchBody(query, city, lat, lng))
                    .retrieve()
                    .body(JsonNode.class);

            List<ExternalHotelCardDto> hotels = new ArrayList<>();
            JsonNode places = body == null ? null : body.path("places");
            if (places != null && places.isArray()) {
                places.forEach((place) -> hotels.add(toCardDto(place, false)));
            }
            return new ExternalHotelSearchResponse(hotels, hotels.size(), false, SOURCE_GOOGLE_MAPS);
        } catch (RestClientException ex) {
            return mockSearch();
        }
    }

    private ExternalHotelDetailsResponse fetchDetails(String placeId) {
        try {
            JsonNode place = placesClient.get()
                    .uri("/places/{placeId}", placeId)
                    .header("X-Goog-Api-Key", properties.getApiKey())
                    .header("X-Goog-FieldMask", detailsFieldMask())
                    .retrieve()
                    .body(JsonNode.class);
            return toDetailsDto(place, false);
        } catch (RestClientException ex) {
            return mockDetails(placeId);
        }
    }

    private PhotoResult fetchPhoto(String photoName) {
        try {
            String mediaUrl = "%s/%s/media?maxWidthPx=%d&skipHttpRedirect=true".formatted(
                    trimTrailingSlash(properties.getBaseUrl()),
                    trimLeadingSlash(photoName),
                    properties.getPhotoMaxWidthPx());
            JsonNode media = genericClient.get()
                    .uri(mediaUrl)
                    .header("X-Goog-Api-Key", properties.getApiKey())
                    .retrieve()
                    .body(JsonNode.class);
            String photoUri = text(media, "photoUri");
            if (!StringUtils.hasText(photoUri)) {
                return placeholderPhoto();
            }

            ResponseEntity<byte[]> response = genericClient.get()
                    .uri(photoUri)
                    .retrieve()
                    .toEntity(byte[].class);
            MediaType contentType = response.getHeaders().getContentType();
            return new PhotoResult(
                    response.getBody() == null ? new byte[0] : response.getBody(),
                    contentType == null ? MediaType.IMAGE_JPEG_VALUE : contentType.toString());
        } catch (RestClientException ex) {
            return placeholderPhoto();
        }
    }

    private Map<String, Object> buildSearchBody(String query, String city, Double lat, Double lng) {
        String textQuery = buildTextQuery(query, city);
        if (lat == null || lng == null) {
            return Map.of("textQuery", textQuery);
        }

        return Map.of(
                "textQuery", textQuery,
                "locationBias", Map.of(
                        "circle", Map.of(
                                "center", Map.of("latitude", lat, "longitude", lng),
                                "radius", 5000.0)));
    }

    private String buildTextQuery(String query, String city) {
        String cleanQuery = normalize(query);
        String cleanCity = normalize(city);
        if (StringUtils.hasText(cleanQuery) && StringUtils.hasText(cleanCity)) {
            return "%s hotels in %s".formatted(cleanQuery, cleanCity);
        }
        if (StringUtils.hasText(cleanQuery)) {
            return "%s hotels".formatted(cleanQuery);
        }
        if (StringUtils.hasText(cleanCity)) {
            return "hotels in %s".formatted(cleanCity);
        }
        return StringUtils.hasText(properties.getDefaultSearchText())
                ? properties.getDefaultSearchText()
                : "hotels in Riyadh";
    }

    private ExternalHotelCardDto toCardDto(JsonNode place, boolean mock) {
        return new ExternalHotelCardDto(
                text(place, "id"),
                nestedText(place, "displayName", "text"),
                text(place, "formattedAddress"),
                doubleValue(place, "rating"),
                intValue(place, "userRatingCount"),
                firstPhotoName(place),
                text(place, "googleMapsUri"),
                SOURCE_GOOGLE_MAPS,
                mock);
    }

    private ExternalHotelDetailsResponse toDetailsDto(JsonNode place, boolean mock) {
        ExternalHotelDetailsResponse response = new ExternalHotelDetailsResponse();
        response.setPlaceId(text(place, "id"));
        response.setName(nestedText(place, "displayName", "text"));
        response.setAddress(text(place, "formattedAddress"));
        response.setRating(doubleValue(place, "rating"));
        response.setUserRatingCount(intValue(place, "userRatingCount"));
        response.setPhotoName(firstPhotoName(place));
        response.setGoogleMapsUri(text(place, "googleMapsUri"));
        response.setWebsiteUri(text(place, "websiteUri"));
        response.setInternationalPhoneNumber(text(place, "internationalPhoneNumber"));
        response.setLatitude(nestedDouble(place, "location", "latitude"));
        response.setLongitude(nestedDouble(place, "location", "longitude"));
        response.setSource(SOURCE_GOOGLE_MAPS);
        response.setMock(mock);
        response.setReviews(properties.isDemoKeyMode() ? null : toReviews(place));
        return response;
    }

    private List<ExternalHotelDetailsResponse.ReviewDto> toReviews(JsonNode place) {
        List<ExternalHotelDetailsResponse.ReviewDto> reviews = new ArrayList<>();
        JsonNode reviewNodes = place == null ? null : place.path("reviews");
        if (reviewNodes != null && reviewNodes.isArray()) {
            reviewNodes.forEach((review) -> reviews.add(new ExternalHotelDetailsResponse.ReviewDto(
                    nestedText(review, "authorAttribution", "displayName"),
                    doubleValue(review, "rating"),
                    nestedText(review, "text", "text"),
                    text(review, "relativePublishTimeDescription"))));
        }
        return reviews;
    }

    private ExternalHotelSearchResponse mockSearch() {
        List<ExternalHotelCardDto> hotels = List.of(
                mockCard("curated-riyadh-olaya", "Roomify Riyadh Olaya Hotel", "Olaya Street, Riyadh", 4.7, 1280),
                mockCard("curated-jeddah-corniche", "Roomify Jeddah Corniche Hotel", "North Corniche, Jeddah", 4.6, 932),
                mockCard("curated-makkah-naseem", "Roomify Makkah Al-Naseem Hotel", "Al-Naseem District, Makkah", 4.5, 1188),
                mockCard("curated-alula-heritage", "Roomify AlUla Heritage Resort", "AlUla, Saudi Arabia", 4.8, 611));
        return new ExternalHotelSearchResponse(hotels, hotels.size(), false, SOURCE_GOOGLE_MAPS);
    }

    private ExternalHotelDetailsResponse mockDetails(String placeId) {
        ExternalHotelCardDto card = mockSearch().getHotels().stream()
                .filter((hotel) -> hotel.getPlaceId().equals(placeId))
                .findFirst()
                .orElse(mockCard("curated-riyadh-olaya", "Roomify Riyadh Olaya Hotel", "Olaya Street, Riyadh", 4.7, 1280));

        ExternalHotelDetailsResponse response = new ExternalHotelDetailsResponse();
        response.setPlaceId(card.getPlaceId());
        response.setName(card.getName());
        response.setAddress(card.getAddress());
        response.setRating(card.getRating());
        response.setUserRatingCount(card.getUserRatingCount());
        response.setPhotoName(card.getPhotoName());
        response.setGoogleMapsUri(card.getGoogleMapsUri());
        response.setWebsiteUri("https://www.google.com/maps");
        response.setInternationalPhoneNumber("+966 11 000 0000");
        response.setLatitude(24.7136);
        response.setLongitude(46.6753);
        response.setSource(SOURCE_GOOGLE_MAPS);
        response.setMock(false);
        if (properties.isDemoKeyMode()) {
            response.setPhotoName(null);
            response.setReviews(null);
        } else {
            response.setReviews(List.of(
                    new ExternalHotelDetailsResponse.ReviewDto(
                            "Demo guest",
                            5.0,
                            "Excellent location near Olaya business meetings, with fast check-in and polished service.",
                            "2 weeks ago"),
                    new ExternalHotelDetailsResponse.ReviewDto(
                            "GCC business traveler",
                            4.0,
                            "Comfortable rooms, clear invoices, and responsive front desk support.",
                            "1 month ago")));
        }
        return response;
    }

    private ExternalHotelCardDto mockCard(
            String placeId,
            String name,
            String address,
            double rating,
            int userRatingCount) {
        return new ExternalHotelCardDto(
                placeId,
                name,
                address,
                rating,
                userRatingCount,
                "curated:" + placeId,
                "https://www.google.com/maps/search/?api=1&query=" + name.replace(" ", "+"),
                SOURCE_GOOGLE_MAPS,
                false);
    }

    private PhotoResult placeholderPhoto() {
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
                  <rect width="960" height="540" fill="#eef4f8"/>
                  <rect x="120" y="130" width="720" height="280" rx="28" fill="#d7e6ef"/>
                  <path d="M210 378h540V236L640 154 530 258 442 210z" fill="#35658d" opacity=".35"/>
                  <circle cx="320" cy="210" r="44" fill="#35658d" opacity=".45"/>
                  <text x="480" y="460" text-anchor="middle" font-family="Arial" font-size="30" fill="#264b6b" font-weight="700">Roomify Saudi hotel preview</text>
                </svg>
                """;
        return new PhotoResult(svg.getBytes(StandardCharsets.UTF_8), MediaType.valueOf("image/svg+xml").toString());
    }

    private boolean isMockPlace(String placeId) {
        return placeId != null && (placeId.startsWith("mock-") || placeId.startsWith("curated-"));
    }

    private String searchFieldMask() {
        return properties.isDemoKeyMode() ? DEMO_SEARCH_FIELD_MASK : SEARCH_FIELD_MASK;
    }

    private String detailsFieldMask() {
        return properties.isDemoKeyMode() ? DEMO_DETAILS_FIELD_MASK : DETAILS_FIELD_MASK;
    }

    private Duration ttl() {
        return Duration.ofSeconds(Math.max(30, properties.getCacheTtlSeconds()));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.replaceAll("/+$", "");
    }

    private static String trimLeadingSlash(String value) {
        return value == null ? "" : value.replaceAll("^/+", "");
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.path(field);
        return value == null || value.isMissingNode() || value.isNull() ? null : value.asText(null);
    }

    private static String nestedText(JsonNode node, String parent, String child) {
        JsonNode value = node == null ? null : node.path(parent).path(child);
        return value == null || value.isMissingNode() || value.isNull() ? null : value.asText(null);
    }

    private static Double doubleValue(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.path(field);
        return value == null || !value.isNumber() ? null : value.asDouble();
    }

    private static Double nestedDouble(JsonNode node, String parent, String child) {
        JsonNode value = node == null ? null : node.path(parent).path(child);
        return value == null || !value.isNumber() ? null : value.asDouble();
    }

    private static Integer intValue(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.path(field);
        return value == null || !value.isInt() ? null : value.asInt();
    }

    private static String firstPhotoName(JsonNode place) {
        JsonNode photos = place == null ? null : place.path("photos");
        if (photos != null && photos.isArray() && !photos.isEmpty()) {
            return text(photos.get(0), "name");
        }
        return null;
    }

    public record PhotoResult(byte[] bytes, String contentType) {
    }
}
