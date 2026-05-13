package com.battery.platform.api.alarm;

import com.battery.platform.api.entity.mysql.AlarmEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlarmWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.debug("告警WebSocket连接已建立: sessionId={}, userId={}", session.getId(), session.getAttributes().get("userId"));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.debug("告警WebSocket连接已关闭: sessionId={}, status={}", session.getId(), status);
    }

    public void broadcastAlarm(AlarmEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of("event", event));
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(payload));
                    }
                }
            }
            log.debug("告警已通过WebSocket推送: eventId={}, sessions={}", event.getId(), sessions.size());
        } catch (Exception e) {
            log.error("WebSocket推送告警失败: {}", e.getMessage(), e);
        }
    }
}
