package com.airesume.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeResponse {
    private Long id;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    private String status;
    private Integer aiScore;
    private String aiSummary;
    private List<SuggestionDto> aiSuggestions;
    private List<String> aiKeywords;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

