package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("Analog")
public class AnalogNode {
    @Id
    private String id;
    private String analogCode;
    private String cellId;
    private String description;
    private String unit;
    private String dataType;
    @Relationship(type = "MAPPED_IN", direction = Relationship.Direction.OUTGOING)
    private StationNode station;
}
