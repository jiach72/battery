package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("EnergyUnit")
public class EnergyUnitNode {
    @Id
    private String id;
    private String name;
    private Double capacity;
    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private StationNode station;
}
