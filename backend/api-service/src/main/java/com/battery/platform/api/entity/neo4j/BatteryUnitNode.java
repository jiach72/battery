package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("BatteryUnit")
public class BatteryUnitNode {
    @Id
    private String id;
    private String name;
    private Integer containerNo;
    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private EnergyUnitNode energyUnit;
}
