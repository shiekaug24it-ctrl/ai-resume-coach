package com.airesume.service;

import com.airesume.dto.AnalysisResponse;
import com.airesume.dto.ResumeResponse;
import com.airesume.dto.SuggestionDto;
import com.airesume.entity.Resume;
import com.airesume.repository.ResumeRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final FileStorageService fileStorageService;
    private final AiAnalysisService aiAnalysisService;
    private final ObjectMapper objectMapper;

    public ResumeService(ResumeRepository resumeRepository,
                         FileStorageService fileStorageService,
                         AiAnalysisService aiAnalysisService,
                         ObjectMapper objectMapper) {
        this.resumeRepository = resumeRepository;
        this.fileStorageService = fileStorageService;
        this.aiAnalysisService = aiAnalysisService;
        this.objectMapper = objectMapper;
    }

    public ResumeResponse uploadResume(MultipartFile file, String extractedText, Long userId) {
        String filePath = fileStorageService.storeFile(file, userId, file.getOriginalFilename());

        Resume resume = Resume.builder()
                .userId(userId)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .extractedText(extractedText)
                .status(extractedText != null && !extractedText.isEmpty() ? "analyzing" : "uploaded")
                .build();

        resume = resumeRepository.save(resume);

        // Trigger async analysis if text available
        if (extractedText != null && !extractedText.isEmpty()) {
            analyzeAndSave(resume);
        }

        return toResponse(resume);
    }

    public List<ResumeResponse> getUserResumes(Long userId) {
        return resumeRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ResumeResponse getResume(Long id, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        return toResponse(resume);
    }

    public void deleteResume(Long id, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        fileStorageService.deleteFile(resume.getFilePath());
        resumeRepository.deleteByIdAndUserId(id, userId);
    }

    public Resource downloadResume(Long id, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        return fileStorageService.loadFile(resume.getFilePath());
    }

    public String getFilename(Long id, Long userId) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        return resume.getFileName();
    }

    private void analyzeAndSave(Resume resume) {
        try {
            AnalysisResponse analysis = aiAnalysisService.analyzeResume(
                    resume.getExtractedText(), resume.getFileName());

            resume.setAiScore(analysis.getScore());
            resume.setAiSummary(analysis.getSummary());
            resume.setAiSuggestions(objectMapper.writeValueAsString(analysis.getSuggestions()));
            resume.setAiKeywords(objectMapper.writeValueAsString(analysis.getKeywords()));
            resume.setStatus("analyzed");
        } catch (Exception e) {
            resume.setStatus("analysis_failed");
            // Log error
        }
        resumeRepository.save(resume);
    }

    private ResumeResponse toResponse(Resume resume) {
        List<SuggestionDto> suggestions = null;
        List<String> keywords = null;

        try {
            if (resume.getAiSuggestions() != null) {
                suggestions = objectMapper.readValue(resume.getAiSuggestions(),
                        new TypeReference<List<SuggestionDto>>() {});
            }
            if (resume.getAiKeywords() != null) {
                keywords = objectMapper.readValue(resume.getAiKeywords(),
                        new TypeReference<List<String>>() {});
            }
        } catch (Exception e) {
            // Ignore parse errors
        }

        return ResumeResponse.builder()
                .id(resume.getId())
                .fileName(resume.getFileName())
                .fileSize(resume.getFileSize())
                .mimeType(resume.getMimeType())
                .status(resume.getStatus())
                .aiScore(resume.getAiScore())
                .aiSummary(resume.getAiSummary())
                .aiSuggestions(suggestions)
                .aiKeywords(keywords)
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }
}

