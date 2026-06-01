package com.roomify.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Service;

@Service
public class ExternalHotelCacheService {

    private final ConcurrentMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public <T> Optional<T> get(String key, Class<T> type) {
        CacheEntry entry = cache.get(key);
        if (entry == null) {
            return Optional.empty();
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            cache.remove(key);
            return Optional.empty();
        }

        Object value = entry.value();
        return type.isInstance(value) ? Optional.of(type.cast(value)) : Optional.empty();
    }

    public void put(String key, Object value, Duration ttl) {
        cache.put(key, new CacheEntry(value, Instant.now().plus(ttl)));
    }

    private record CacheEntry(Object value, Instant expiresAt) {
    }
}
