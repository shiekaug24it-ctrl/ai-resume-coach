package com.airesume;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AiResumeApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiResumeApplication.class, args);
    }
}

