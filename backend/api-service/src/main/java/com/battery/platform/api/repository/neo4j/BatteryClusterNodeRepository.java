package com.battery.platform.api.repository.neo4j;

import com.battery.platform.api.entity.neo4j.BatteryClusterNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;

public interface BatteryClusterNodeRepository extends Neo4jRepository<BatteryClusterNode, String> {
}
