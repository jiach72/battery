package com.battery.platform.api.repository.neo4j;

import com.battery.platform.api.entity.neo4j.StationNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;

public interface StationNodeRepository extends Neo4jRepository<StationNode, String> {
}
