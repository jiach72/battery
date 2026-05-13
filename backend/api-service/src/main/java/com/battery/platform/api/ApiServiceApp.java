package com.battery.platform.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ApiServiceApp {
    public static void main(String[] args) {
        SpringApplication.run(ApiServiceApp.class, args);
    }
}
