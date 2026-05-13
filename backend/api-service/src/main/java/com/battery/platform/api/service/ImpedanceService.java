package com.battery.platform.api.service;

import com.battery.platform.api.dto.ImpedanceDiagnosisDTO;
import com.battery.platform.api.dto.ImpedanceSpectrumDTO;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImpedanceService {

    @Value("${algorithm.engine.url}")
    private String algorithmEngineUrl;

    @Value("${algorithm.engine.api-key}")
    private String algorithmApiKey;

    private final RestTemplate restTemplate;
    private final DemoDataService demoDataService;

    public ImpedanceSpectrumDTO getSpectrum(String cellId, String method) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (algorithmApiKey != null && !algorithmApiKey.isBlank()) {
                headers.set("X-Internal-Token", algorithmApiKey);
            }

            Map<String, Object> request = Map.of(
                    "cellId", cellId,
                    "method", method,
                    "frequenciesHz", List.of(0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0),
                    "realOhm", List.of(0.182, 0.176, 0.170, 0.162, 0.158, 0.151, 0.148),
                    "imagOhm", List.of(-0.011, -0.019, -0.026, -0.031, -0.029, -0.018, -0.010),
                    "temperature", 25.3,
                    "soc", 82.1
            );
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    algorithmEngineUrl + "/algo/eis/analyze",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object data = body.get("data");
                if (data instanceof Map<?, ?> map) {
                    return toSpectrumDto(cellId, (Map<String, Object>) map);
                }
                return toSpectrumDto(cellId, body);
            }
            log.warn("EIS 算法响应异常: status={}", response.getStatusCode());
        } catch (Exception e) {
            log.error("调用 EIS 算法失败，使用本地回退方案: {}", e.getMessage());
        }
        return fallbackSpectrum(cellId);
    }

    public ImpedanceDiagnosisDTO diagnose(String cellId, String method) {
        ImpedanceSpectrumDTO spectrum = getSpectrum(cellId, method);
        ImpedanceDiagnosisDTO dto = new ImpedanceDiagnosisDTO();
        dto.setDeviceId(cellId);
        dto.setDeviceName(spectrum.getDeviceName());
        dto.setDiagnosisLevel("cell");
        dto.setScore(78.5);
        dto.setConclusion("阻抗谱特征轻度偏移，建议继续观测");
        dto.setRiskLevel("medium");
        dto.setFeatures(List.of(
                Map.of("name", "R0", "value", spectrum.getRealOhm().isEmpty() ? 0.0 : spectrum.getRealOhm().get(0)),
                Map.of("name", "Rct", "value", 0.062),
                Map.of("name", "peak_shift", "value", 0.014)
        ));
        dto.setRecommendations(List.of(
                "补采高低频点位",
                "与温度/SOC 进行同批次对齐",
                "纳入后续 EIS 模型训练集"
        ));
        dto.setMethod(spectrum.getMethod());
        return dto;
    }

    private ImpedanceSpectrumDTO toSpectrumDto(String cellId, Map<String, Object> data) {
        ImpedanceSpectrumDTO dto = new ImpedanceSpectrumDTO();
        dto.setSpectrumId(String.valueOf(data.getOrDefault("spectrumId", data.getOrDefault("spectrum_id", "eis-" + cellId))));
        dto.setDeviceId(cellId);
        dto.setDeviceName("单体 " + cellId);
        dto.setMeasuredAt("2026-05-12 10:00:00");
        dto.setTemperature("25.3");
        dto.setSoc("82.1");
        dto.setMethod(String.valueOf(data.getOrDefault("method", "deterministic-nyquist-baseline")));
        dto.setFrequenciesHz(asDoubleList(data.get("frequenciesHz"), data.get("frequencies_hz")));
        dto.setRealOhm(asDoubleList(data.get("realOhm"), data.get("real_ohm")));
        dto.setImagOhm(asDoubleList(data.get("imagOhm"), data.get("imag_ohm")));
        return dto;
    }

    private ImpedanceSpectrumDTO fallbackSpectrum(String cellId) {
        ImpedanceSpectrumDTO dto = new ImpedanceSpectrumDTO();
        dto.setSpectrumId("eis-" + cellId);
        dto.setDeviceId(cellId);
        dto.setDeviceName("单体 " + cellId);
        dto.setMeasuredAt("2026-05-12 10:00:00");
        dto.setTemperature("25.3");
        dto.setSoc("82.1");
        dto.setMethod("local-fallback-baseline");
        dto.setFrequenciesHz(List.of(0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0));
        dto.setRealOhm(List.of(0.182, 0.176, 0.170, 0.162, 0.158, 0.151, 0.148));
        dto.setImagOhm(List.of(-0.011, -0.019, -0.026, -0.031, -0.029, -0.018, -0.010));
        return dto;
    }

    @SuppressWarnings("unchecked")
    private List<Double> asDoubleList(Object primary, Object secondary) {
        Object value = primary != null ? primary : secondary;
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(item -> {
                        if (item instanceof Number number) {
                            return number.doubleValue();
                        }
                        try {
                            return Double.parseDouble(String.valueOf(item));
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }
        return List.of();
    }
}
