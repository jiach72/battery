package com.battery.platform.api.repository.neo4j;

import com.battery.platform.api.entity.neo4j.UserNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import java.util.Optional;

public interface UserNodeRepository extends Neo4jRepository<UserNode, String> {
    Optional<UserNode> findByUsername(String username);
}
