package com.empresa.sistema.domain.service;

import com.empresa.sistema.domain.service.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadService.class);

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Value("${app.upload.directory:uploads}")
    private String uploadDirectory;

    @Value("${app.upload.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    /**
     * Upload de foto de perfil de candidato
     */
    public String uploadCandidatePhoto(MultipartFile file) {
        return uploadFile(file, "candidates/photos");
    }

    /**
     * Upload genérico de arquivo
     */
    public String uploadFile(MultipartFile file, String subDirectory) {
        validateFile(file);

        try {
            // Criar diretórios se não existirem
            Path uploadPath = Paths.get(uploadDirectory, subDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Gerar nome único para o arquivo
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Salvar arquivo
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Retornar URL do arquivo
            String fileUrl = baseUrl + "/" + subDirectory + "/" + fileName;

            logger.info("Arquivo uploadado com sucesso: {} -> {}", originalFilename, fileUrl);
            return fileUrl;

        } catch (IOException e) {
            logger.error("Erro ao fazer upload do arquivo: {}", file.getOriginalFilename(), e);
            throw new BusinessException("Falha ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    /**
     * Validar arquivo de imagem
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("Arquivo está vazio");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("Arquivo muito grande. Tamanho máximo: 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("Tipo de arquivo não permitido. Permitidos: JPEG, PNG, GIF, WebP");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new BusinessException("Nome do arquivo é inválido");
        }
    }

    /**
     * Extrair extensão do arquivo
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Deletar arquivo pelo caminho
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith(baseUrl)) {
            return;
        }

        try {
            String relativePath = fileUrl.replace(baseUrl + "/", "");
            Path filePath = Paths.get(uploadDirectory, relativePath);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                logger.info("Arquivo deletado: {}", fileUrl);
            }
        } catch (IOException e) {
            logger.error("Erro ao deletar arquivo: {}", fileUrl, e);
        }
    }
}