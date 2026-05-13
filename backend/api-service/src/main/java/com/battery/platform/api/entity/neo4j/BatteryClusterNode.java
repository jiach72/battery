package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("BatteryCluster")
public class BatteryClusterNode {
    @Id
    private String id;
    private String name;
    private Integer clusterNo;
    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private BatteryUnitNode batteryUnit;
}
