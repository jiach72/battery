package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;
import java.util.List;
import java.util.UUID;

@Data
@Node("User")
public class UserNode {
    @Id
    private String id;
    private String username;
    private String password;
    private String displayName;
    private Boolean enabled;
    @Relationship(type = "HAS_ROLE", direction = Relationship.Direction.OUTGOING)
    private List<RoleNode> roles;

    /**
     * 创建新用户时自动生成UUID主键
     */
    public void generateIdIfAbsent() {
        if (this.id == null || this.id.isBlank()) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
