package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("Station")
public class StationNode {
    @Id
    private String id;
    private String name;
    private String location;
    private Double capacity;
    private String status;
}
