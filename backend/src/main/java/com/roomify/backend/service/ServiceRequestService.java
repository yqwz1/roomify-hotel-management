package com.roomify.backend.service;

import com.roomify.backend.dto.ServiceRequestCreateRequest;
import com.roomify.backend.dto.ServiceRequestResponse;
import com.roomify.backend.entity.ServiceRequestStatus;
import java.util.List;

public interface ServiceRequestService {
    ServiceRequestResponse createForCurrentGuest(ServiceRequestCreateRequest request);
    List<ServiceRequestResponse> listForCurrentGuest();
    List<ServiceRequestResponse> listForStaff();
    ServiceRequestResponse updateStatus(Long id, ServiceRequestStatus status);
}
