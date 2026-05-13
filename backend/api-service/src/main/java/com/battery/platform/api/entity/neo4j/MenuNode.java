package com.battery.platform.api.entity.neo4j;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

@Data
@Node("Menu")
public class MenuNode {
    @Id
    private String id;
    private String name;
    private String path;
    private String icon;
    private Integer sort;
    private String parentId;
}
