package com.roomify.backend.assistant.service;

import com.roomify.backend.assistant.entity.GuestConversation;
import com.roomify.backend.assistant.entity.GuestConversationMessage;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class TemplateGuestAssistantAiService implements GuestAssistantAiService {

    @Override
    public GuestAssistantAiReply generateReply(
            GuestConversation conversation,
            GuestConversationMessage guestMessage) {
        String normalized = guestMessage.getOriginalBody() == null
                ? ""
                : guestMessage.getOriginalBody().toLowerCase(Locale.ROOT);

        String answer;
        if (normalized.contains("check-in") || normalized.contains("check in")) {
            answer = "Our standard check-in time is 3:00 PM. If your room is ready earlier, the front desk will gladly help you.";
        } else if (normalized.contains("check-out") || normalized.contains("checkout") || normalized.contains("check out")) {
            answer = "Our standard check-out time is 12:00 PM. If you need extra time, we can forward a late check-out or stay-extension request to the front desk.";
        } else if (normalized.contains("towel") || normalized.contains("amenit") || normalized.contains("pillows")) {
            answer = "I have noted your amenity request. If a staff member is not immediately available, the next available team member will review it shortly.";
        } else if (normalized.contains("housekeeping") || normalized.contains("clean")) {
            answer = "Housekeeping support has been noted. A team member will review the request and update you as soon as possible.";
        } else if (normalized.contains("maintenance") || normalized.contains("broken") || normalized.contains("problem")) {
            answer = "I'm sorry about the inconvenience. I have marked this as a maintenance concern so the hotel team can review it quickly.";
        } else if (normalized.contains("taxi") || normalized.contains("transport")) {
            answer = "Transport assistance has been noted. The front desk can help arrange a taxi and confirm pickup details.";
        } else if (normalized.contains("restaurant") || normalized.contains("breakfast") || normalized.contains("dinner")) {
            answer = "Restaurant and dining assistance is available through the hotel team. Please tell us what you need and staff will continue the conversation.";
        } else if (normalized.contains("extend") || normalized.contains("stay longer")) {
            answer = "A stay-extension request usually depends on room availability. I have kept the conversation active so staff can confirm the next available option.";
        } else {
            answer = "Thank you for your message. If a staff member does not respond immediately, I will continue assisting with general hotel information while the team reviews your request.";
        }

        return new GuestAssistantAiReply(answer, "en");
    }
}
