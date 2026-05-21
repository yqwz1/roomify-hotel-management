package com.roomify.backend.service;

import com.roomify.backend.dto.ServiceRequestCreateRequest;
import com.roomify.backend.dto.ServiceRequestResponse;
import com.roomify.backend.entity.Reservation;
import com.roomify.backend.entity.ServiceRequest;
import com.roomify.backend.entity.ServiceRequestPriority;
import com.roomify.backend.entity.ServiceRequestStatus;
import com.roomify.backend.exception.ResourceNotFoundException;
import com.roomify.backend.repository.ServiceRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ServiceRequestServiceImpl implements ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final GuestReservationService guestReservationService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Override
    public ServiceRequestResponse createForCurrentGuest(ServiceRequestCreateRequest request) {
        Reservation reservation = guestReservationService.requireActiveGuestReservationForRoom(request.getRoomId());

        ServiceRequest entity = new ServiceRequest();
        entity.setGuest(reservation.getGuest());
        entity.setRoom(reservation.getRoom());
        entity.setServiceType(request.getServiceType());
        entity.setDescription(request.getDescription().trim());
        entity.setPriority(request.getPriority() != null ? request.getPriority() : ServiceRequestPriority.MEDIUM);
        entity.setStatus(ServiceRequestStatus.PENDING);

        ServiceRequest saved = serviceRequestRepository.save(entity);
        auditService.log(
                "SERVICE_REQUEST_CREATED",
                "ServiceRequest#" + saved.getId(),
                "guestId=" + saved.getGuestId() + " roomId=" + saved.getRoomId() + " type=" + saved.getServiceType());
        return ServiceRequestResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> listForCurrentGuest() {
        return serviceRequestRepository.findAllByGuest_IdInOrderByCreatedAtDesc(
                        guestReservationService.getAuthenticatedGuestIds())
                .stream()
                .map(ServiceRequestResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> listForStaff() {
        return serviceRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ServiceRequestResponse::from)
                .toList();
    }

    @Override
    public ServiceRequestResponse updateStatus(Long id, ServiceRequestStatus status) {
        ServiceRequest entity = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found with id: " + id));

        boolean newlyCompleted = entity.getStatus() != ServiceRequestStatus.COMPLETED
                && status == ServiceRequestStatus.COMPLETED;
        entity.setStatus(status);
        ServiceRequest saved = serviceRequestRepository.save(entity);
        auditService.log(
                "SERVICE_REQUEST_STATUS_UPDATED",
                "ServiceRequest#" + saved.getId(),
                "status=" + saved.getStatus());

        if (newlyCompleted) {
            notificationService.notifyServiceRequestCompleted(saved);
            emailService.sendServiceRequestCompletedEmail(saved, org.springframework.context.i18n.LocaleContextHolder.getLocale().toLanguageTag());
        }
        return ServiceRequestResponse.from(saved);
    }
}
