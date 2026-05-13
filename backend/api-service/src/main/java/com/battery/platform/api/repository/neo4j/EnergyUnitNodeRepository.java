package com.battery.platform.api.repository.neo4j;

import com.battery.platform.api.entity.neo4j.EnergyUnitNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EnergyUnitNodeRepository extends Neo4jRepository<EnergyUnitNode, String> {
    List<EnergyUnitNode> findByStationId(String stationId);

    /**
     * 批量查询多个站点的储能单元，避免N+1问题
     * 返回的EnergyUnitNode会自动加载BELONGS_TO关系
     */
    @Query("MATCH (eu:EnergyUnit)-[:BELONGS_TO]->(s:Station) " +
           "WHERE s.id IN $stationIds " +
           "RETURN eu")
    List<EnergyUnitNode> findByStationIds(@Param("stationIds") List<String> stationIds);

    /**
     * 批量统计各站点的储能单元数量
     */
    @Query("MATCH (eu:EnergyUnit)-[:BELONGS_TO]->(s:Station) " +
           "WHERE s.id IN $stationIds " +
           "RETURN s.id AS stationId, count(eu) AS cnt")
    List<Object[]> countByStationIdsRaw(@Param("stationIds") List<String> stationIds);
}
