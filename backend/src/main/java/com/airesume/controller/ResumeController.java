package com.airesume.controller;

import com.airesume.dto.ResumeResponse;
import com.airesume.service.ResumeService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "extractedText", required = false) String extractedText,
            @RequestAttribute("userId") Long userId) {

        ResumeResponse response = resumeService.uploadResume(file, extractedText, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ResumeResponse>> getResumes(@RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(resumeService.getUserResumes(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponse> getResume(@PathVariable Long id,
                                                     @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(resumeService.getResume(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(@PathVariable Long id,
                                             @RequestAttribute("userId") Long userId) {
        resumeService.deleteResume(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long id,
                                                    @RequestAttribute("userId") Long userId) {
        Resource resource = resumeService.downloadResume(id, userId);
        String filename = resumeService.getFilename(id, userId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}

