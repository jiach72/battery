package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("Cell")
public class CellNode {
    @Id
    private String id;
    private Integer cellNo;
    private Double voltage;
    private Double current;
    private Double temperature;
    private Double soc;
    private Double soh;
    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private BatteryClusterNode batteryCluster;
}
