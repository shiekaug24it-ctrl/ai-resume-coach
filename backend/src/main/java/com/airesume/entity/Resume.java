package com.airesume.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "mime_type", nullable = false, length = 255)
    private String mimeType;

    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "ai_summary", columnDefinition = "LONGTEXT")
    private String aiSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_suggestions", columnDefinition = "json")
    private String aiSuggestions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_keywords", columnDefinition = "json")
    private String aiKeywords;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "uploaded";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

