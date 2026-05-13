package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("Transformer")
public class TransformerNode {
    @Id
    private String id;
    private String name;
    private Double cumulativeEfficiency;
    private Double dailyEfficiency;
    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private EnergyUnitNode energyUnit;
}
