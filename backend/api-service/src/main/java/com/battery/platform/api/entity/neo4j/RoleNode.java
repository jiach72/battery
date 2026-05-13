package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;
import java.util.List;

@Data
@Node("Role")
public class RoleNode {
    @Id
    private String id;
    private String name;
    private String code;
    @Relationship(type = "HAS_MENU", direction = Relationship.Direction.OUTGOING)
    private List<MenuNode> menus;
}
