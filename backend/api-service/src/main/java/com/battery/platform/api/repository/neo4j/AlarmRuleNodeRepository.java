package com.battery.platform.api.repository.neo4j;

import com.battery.platform.api.entity.neo4j.AlarmRuleNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import java.util.List;

public interface AlarmRuleNodeRepository extends Neo4jRepository<AlarmRuleNode, String> {
    List<AlarmRuleNode> findByEnabledTrue();
}
