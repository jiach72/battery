package com.battery.platform.api.repository.neo4j;

import com.battery.platform.api.entity.neo4j.AnalogNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import java.util.List;

public interface AnalogNodeRepository extends Neo4jRepository<AnalogNode, String> {
    List<AnalogNode> findByStationId(String stationId);
}
