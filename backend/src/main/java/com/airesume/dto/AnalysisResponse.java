package com.airesume.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResponse {
    private Integer score;
    private String summary;
    private List<String> strengths;
    private List<SuggestionDto> suggestions;
    private List<String> keywords;
}

