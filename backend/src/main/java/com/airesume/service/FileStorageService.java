package com.airesume.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${storage.upload-dir}")
    private String uploadDir;

    private Path storagePath;

    @PostConstruct
    public void init() {
        this.storagePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storagePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file, Long userId, String originalName) {
        String ext = getExtension(originalName);
        String filename = UUID.randomUUID() + "." + ext;
        Path userDir = storagePath.resolve(String.valueOf(userId));

        try {
            Files.createDirectories(userDir);
            Path target = userDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return String.valueOf(userId) + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource loadFile(String filePath) {
        try {
            Path file = storagePath.resolve(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("File not found or not readable: " + filePath);
        } catch (MalformedURLException e) {
            throw new RuntimeException("File not found: " + filePath, e);
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path file = storagePath.resolve(filePath).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return (dot == -1) ? "bin" : filename.substring(dot + 1);
    }
}

