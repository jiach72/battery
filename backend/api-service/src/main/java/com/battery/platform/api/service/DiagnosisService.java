package com.battery.platform.api.service;

import com.battery.platform.api.config.DemoDataProperties;
import com.battery.platform.api.dto.DiagnosisCaseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiagnosisService {

    private final DemoDataProperties demoDataProperties;

    public List<DiagnosisCaseDTO> getDiagnosisCases(Map<String, Object> request) {
        return List.of(
                buildDemoCase("case-001", "cell-01", "北区1号站-2号单元-簇4-单体01", "温升耦合异常", "high", 0.84),
                buildDemoCase("case-002", "cell-08", "北区1号站-2号单元-簇7-单体08", "一致性退化", "medium", 0.77)
        );
    }

    public DiagnosisCaseDTO getDiagnosisCase(String caseId) {
        if ("case-002".equalsIgnoreCase(caseId)) {
            return buildDemoCase("case-002", "cell-08", "北区1号站-2号单元-簇7-单体08", "一致性退化", "medium", 0.77);
        }
        return buildDemoCase("case-001", "cell-01", "北区1号站-2号单元-簇4-单体01", "温升耦合异常", "high", 0.84);
    }

    private DiagnosisCaseDTO buildDemoCase(String caseId, String deviceId, String deviceName, String conclusion, String riskLevel, double confidence) {
        DiagnosisCaseDTO dto = new DiagnosisCaseDTO();
        dto.setCaseId(caseId);
        dto.setDeviceId(deviceId);
        dto.setDeviceName(deviceName);
        dto.setDiagnosisType("fault-diagnosis");
        dto.setConclusion("疑似" + conclusion + "，建议" + ("high".equals(riskLevel) ? "优先处理" : "持续观测"));
        dto.setRiskLevel(riskLevel);
        dto.setConfidence(confidence);
        dto.setDetectedAt("2026-05-12 10:00:00");
        if ("case-002".equalsIgnoreCase(caseId)) {
            dto.setEvidence(List.of(
                    Map.of("type", "soh", "value", 89.9, "description", "SOH 低于站内均值"),
                    Map.of("type", "consistency", "value", 79.6, "description", "簇内一致性偏低"),
                    Map.of("type", "eis", "value", 0.061, "description", "阻抗谱半圆半径偏大")
            ));
            dto.setRecommendations(List.of(
                    "复核均衡策略",
                    "对比同簇阻抗谱差异",
                    "纳入后续跟踪观察"
            ));
            return dto;
        }
        dto.setEvidence(List.of(
                Map.of("type", "soh", "value", 91.8, "description", "SOH 低于站内均值"),
                Map.of("type", "temp", "value", 37.2, "description", "局部温升偏高"),
                Map.of("type", "volt", "value", 0.112, "description", "末端压差超阈值")
        ));
        dto.setRecommendations(List.of(
                "优先核查冷却支路",
                "复核单体电压离散度",
                "安排一次离线复测"
        ));
        return dto;
    }
}
