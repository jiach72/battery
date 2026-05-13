package com.battery.platform.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.battery.platform.api.repository.mysql")
public class JpaConfig {
}
