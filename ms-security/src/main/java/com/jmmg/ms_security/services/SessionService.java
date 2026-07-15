package com.jmmg.ms_security.services;

import com.jmmg.ms_security.DTOs.Session.GetSessionDTO;
import com.jmmg.ms_security.DTOs.Session.PostSessionDTO;
import com.jmmg.ms_security.models.Session;
import com.jmmg.ms_security.repositories.ISessionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    @Autowired
    private ISessionRepository sessionRepository;

    public List<GetSessionDTO> find() {
        return this.sessionRepository.findAll().stream().map(GetSessionDTO::fromModel)
                .collect(java.util.stream.Collectors.toList());
    }

    public GetSessionDTO findById(String id) {
        Session session = this.sessionRepository.findById(UUID.fromString(id)).orElse(null);
        return GetSessionDTO.fromModel(session);
    }

    public GetSessionDTO create(PostSessionDTO postSessionDTO) {
        Session newSession = new Session(postSessionDTO);
        Session savedSession = this.sessionRepository.save(newSession);
        return GetSessionDTO.fromModel(savedSession);
    }

    public GetSessionDTO update(String id, PostSessionDTO postSessionDTO) {
        Session actualSession = this.sessionRepository.findById(UUID.fromString(id)).orElse(null);

        if (actualSession != null) {
            actualSession.updateFromDTO(postSessionDTO);
            this.sessionRepository.save(actualSession);
            return GetSessionDTO.fromModel(actualSession);
        } else {
            return null;
        }
    }

    public void delete(String id) {
        Session theSession = this.sessionRepository.findById(UUID.fromString(id)).orElse(null);
        if (theSession != null) {
            this.sessionRepository.delete(theSession);
        }
    }
}
