package com.jmmg.ms_security.infra.errors;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jmmg.ms_security.DTOs.errors.ErrorDTO;
import com.jmmg.ms_security.DTOs.errors.FieldErrorDTO;
import com.jmmg.ms_security.infra.exception.DataNotFound;
import com.jmmg.ms_security.infra.exception.EntityAlreadyExists;
import com.jmmg.ms_security.infra.exception.InvalidCredentials;
import com.jmmg.ms_security.infra.exception.MissingData;
import com.jmmg.ms_security.infra.exception.NotPermitted;

@RestControllerAdvice
public class ErrorHandle {

    @ExceptionHandler({ DataNotFound.class })
    public ResponseEntity<ErrorDTO> handleEntityNotFound(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorDTO(e.getMessage(), "404"));
    }

    @ExceptionHandler(InvalidCredentials.class)
    public ResponseEntity<ErrorDTO> handleInvalidCredentials(InvalidCredentials e) {
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

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorDTO> handleServiceUnavailable(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorDTO(e.getMessage(), "503"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<FieldErrorDTO>> handleValidationErrors(MethodArgumentNotValidException e) {
        List<FieldErrorDTO> errors = e.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDTO(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}
