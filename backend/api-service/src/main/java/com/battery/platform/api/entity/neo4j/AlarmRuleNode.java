package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("AlarmRule")
public class AlarmRuleNode {
    @Id
    private String id;
    private String name;
    private String condition;
    private String riskType;
    private String severity;
    private String notifyType;
    private Boolean enabled;
}
