package com.battery.platform.api.dto;

import lombok.Data;

import java.util.List;

@Data
public class ImpedanceSpectrumDTO {
    private String spectrumId;
    private String deviceId;
    private String deviceName;
    private String measuredAt;
    private String temperature;
    private String soc;
    private List<Double> frequenciesHz;
    private List<Double> realOhm;
    private List<Double> imagOhm;
    private String method;
}
