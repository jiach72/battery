package com.battery.platform.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OmService {

    @Value("${algorithm.engine.url}")
    private String algorithmEngineUrl;

    @Value("${algorithm.engine.api-key}")
    private String algorithmApiKey;

    private final RestTemplate restTemplate;
    private final DemoDataService demoDataService;

    public Map<String, Object> simulatePlan(Map<String, Object> request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (algorithmApiKey != null && !algorithmApiKey.isBlank()) {
                headers.set("X-Internal-Token", algorithmApiKey);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    algorithmEngineUrl + "/algo/om/optimize",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object data = body.get("data");
                if (data instanceof Map) {
                    Map<String, Object> result = (Map<String, Object>) data;
                    if (result.containsKey("mappings") && result.containsKey("estimatedCost")) {
                        return result;
                    }
                }
                if (body.containsKey("mappings") && body.containsKey("estimatedCost")) {
                    return body;
                }
            }
            log.warn("算法引擎响应异常: status={}", response.getStatusCode());
        } catch (Exception e) {
            log.error("调用算法引擎失败，使用本地回退方案: {}", e.getMessage());
        }

        return demoDataService.buildOmSimulation(request);
    }
}
