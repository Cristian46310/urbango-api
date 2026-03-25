package com.jmmg.ms_security.infra.errors;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jmmg.ms_security.DTOs.ErrorDTO;
import com.jmmg.ms_security.DTOs.FieldErrorDTO;
import com.jmmg.ms_security.infra.exception.DataNotFound;
import com.jmmg.ms_security.infra.exception.EntityAlreadyExists;
import com.jmmg.ms_security.infra.exception.ErrorToken;
import com.jmmg.ms_security.infra.exception.MissingData;
import com.jmmg.ms_security.infra.exception.MissingToken;
import com.jmmg.ms_security.infra.exception.NotPermitted;

@RestControllerAdvice
public class ErrorHandle {

    @ExceptionHandler({ DataNotFound.class })
    public ResponseEntity<ErrorDTO> handleEntityNotFound(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorDTO(e.getMessage(), "404"));
    }

    @ExceptionHandler({ ErrorToken.class, MissingToken.class,
            org.springframework.security.core.AuthenticationException.class })
    public ResponseEntity<ErrorDTO> handleErrorToken(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorDTO(e.getMessage(), "401"));
    }

    @ExceptionHandler(NotPermitted.class)
    public ResponseEntity<ErrorDTO> handleNotPermitted(NotPermitted e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorDTO(e.getMessage(), "403"));
    }

    @ExceptionHandler({ MissingData.class, EntityAlreadyExists.class, IllegalArgumentException.class })
    public ResponseEntity<ErrorDTO> handleBadRequest(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorDTO(e.getMessage(), "400"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<FieldErrorDTO>> handleValidationErrors(MethodArgumentNotValidException e) {
        List<FieldErrorDTO> errors = e.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDTO(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}
