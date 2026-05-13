package com.battery.platform.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DemoDataProperties {

    @Value("${demo-data.enabled:false}")
    private boolean enabled;

    public boolean isEnabled() {
        return enabled;
    }
}
