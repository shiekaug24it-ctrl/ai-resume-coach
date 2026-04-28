package com.airesume.service;

import com.airesume.dto.AnalysisResponse;
import com.airesume.dto.SuggestionDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiAnalysisService {

    @Value("${ai.gemini.api-key}")
    private String apiKey;

    @Value("${ai.gemini.model}")
    private String model;

    @Value("${ai.gemini.gateway-url}")
    private String gatewayUrl;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public AiAnalysisService(ObjectMapper objectMapper) {
        this.webClient = WebClient.builder()
                .baseUrl(gatewayUrl)
                .build();
        this.objectMapper = objectMapper;
    }

    public AnalysisResponse analyzeResume(String resumeText, String fileName) {
        String trimmed = resumeText.length() > 12000 ? resumeText.substring(0, 12000) : resumeText;

        String systemPrompt = "You are an expert resume reviewer and career coach. Analyze resumes and return concise, actionable feedback.";
        String userPrompt = String.format(
                "Analyze this resume%s and provide structured feedback.\n\nResume content:\n%s",
                fileName != null ? " (\"" + fileName + "\")" : "",
                trimmed);

        String requestBody = buildRequestBody(systemPrompt, userPrompt);

        try {
            String response = WebClient.builder()
                    .build()
                    .post()
                    .uri(gatewayUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseAnalysis(response);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 429) {
                throw new RuntimeException("Rate limit exceeded, please try again shortly.");
            }
            if (e.getStatusCode().value() == 402) {
                throw new RuntimeException("AI credits exhausted. Please add funds.");
            }
            throw new RuntimeException("AI analysis failed: " + e.getMessage());
        }
    }

    private String buildRequestBody(String systemPrompt, String userPrompt) {
        return String.format("""
            {
              "model": "%s",
              "messages": [
                {"role": "system", "content": "%s"},
                {"role": "user", "content": "%s"}
              ],
              "tools": [
                {
                  "type": "function",
                  "function": {
                    "name": "submit_resume_analysis",
                    "description": "Return a structured analysis of the resume.",
                    "parameters": {
                      "type": "object",
                      "properties": {
                        "score": {"type": "number", "description": "Overall resume quality score 0-100"},
                        "summary": {"type": "string", "description": "2-3 sentence overall summary"},
                        "strengths": {"type": "array", "items": {"type": "string"}, "description": "3-5 strongest aspects"},
                        "suggestions": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "category": {"type": "string", "enum": ["wording", "formatting", "skills", "experience", "keywords", "structure"]},
                              "tip": {"type": "string"},
                              "priority": {"type": "string", "enum": ["high", "medium", "low"]}
                            },
                            "required": ["category", "tip", "priority"]
                          },
                          "description": "5-8 actionable improvement suggestions"
                        },
                        "keywords": {"type": "array", "items": {"type": "string"}, "description": "Key skills/keywords detected or recommended"}
                      },
                      "required": ["score", "summary", "strengths", "suggestions", "keywords"]
                    }
                  }
                }
              ],
              "tool_choice": {"type": "function", "function": {"name": "submit_resume_analysis"}}
            }
            """, model, escapeJson(systemPrompt), escapeJson(userPrompt));
    }

    private AnalysisResponse parseAnalysis(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode toolCalls = root.path("choices").get(0).path("message").path("tool_calls");

            if (toolCalls.isMissingNode() || !toolCalls.isArray() || toolCalls.isEmpty()) {
                throw new RuntimeException("No tool call returned by AI");
            }

            String arguments = toolCalls.get(0).path("function").path("arguments").asText();
            JsonNode analysis = objectMapper.readTree(arguments);

            List<SuggestionDto> suggestions = new ArrayList<>();
            JsonNode suggNode = analysis.path("suggestions");
            if (suggNode.isArray()) {
                for (JsonNode s : suggNode) {
                    suggestions.add(SuggestionDto.builder()
                            .category(s.path("category").asText())
                            .tip(s.path("tip").asText())
                            .priority(s.path("priority").asText())
                            .build());
                }
            }

            List<String> keywords = new ArrayList<>();
            JsonNode kwNode = analysis.path("keywords");
            if (kwNode.isArray()) {
                for (JsonNode k : kwNode) {
                    keywords.add(k.asText());
                }
            }

            List<String> strengths = new ArrayList<>();
            JsonNode strNode = analysis.path("strengths");
            if (strNode.isArray()) {
                for (JsonNode s : strNode) {
                    strengths.add(s.asText());
                }
            }

            return AnalysisResponse.builder()
                    .score(analysis.path("score").asInt())
                    .summary(analysis.path("summary").asText())
                    .strengths(strengths)
                    .suggestions(suggestions)
                    .keywords(keywords)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }

    private String escapeJson(String str) {
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}

