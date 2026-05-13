package com.battery.platform.api.alarm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlarmConsumer {

    private static final String DEAD_LETTER_TOPIC = "alarm-dead-letter";

    private final AlarmRuleMatcher alarmRuleMatcher;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @KafkaListener(topics = "alarm", groupId = "battery-platform")
    public void consume(String message) {
        log.info("收到告警消息: {}", message);
        try {
            alarmRuleMatcher.matchAndPersist(message);
        } catch (Exception e) {
            log.error("告警匹配失败，消息将发送到死信队列: {}", e.getMessage(), e);
            try {
                kafkaTemplate.send(DEAD_LETTER_TOPIC, message);
                log.info("消息已发送到死信队列: topic={}", DEAD_LETTER_TOPIC);
            } catch (Exception dltEx) {
                log.error("发送死信队列失败，消息可能丢失: {}", dltEx.getMessage(), dltEx);
            }
        }
    }
}
