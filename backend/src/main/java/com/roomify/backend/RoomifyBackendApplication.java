package com.roomify.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = {
    "com.roomify.backend.entity",
    "com.roomify.backend.user"
})
public class RoomifyBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(RoomifyBackendApplication.class, args);
  }
}
