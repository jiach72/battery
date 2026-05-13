// ============================================================
// Battery Health Platform - Neo4j Schema & Sample Data
// ============================================================

// -----------------------------------------------------------
// Constraints (unique id for each node type)
// -----------------------------------------------------------
CREATE CONSTRAINT station_id IF NOT EXISTS FOR (n:Station)   REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT unit_id    IF NOT EXISTS FOR (n:EnergyUnit) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT battery_id IF NOT EXISTS FOR (n:BatteryUnit) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT cluster_id IF NOT EXISTS FOR (n:BatteryCluster) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT cell_id    IF NOT EXISTS FOR (n:Cell)      REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT analog_id  IF NOT EXISTS FOR (n:Analog)    REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT rule_id    IF NOT EXISTS FOR (n:AlarmRule) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT user_id    IF NOT EXISTS FOR (n:User)      REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT role_id    IF NOT EXISTS FOR (n:Role)      REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT menu_id    IF NOT EXISTS FOR (n:Menu)      REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT pcs_id     IF NOT EXISTS FOR (n:PCS)       REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT transformer_id IF NOT EXISTS FOR (n:Transformer) REQUIRE n.id IS UNIQUE;

// -----------------------------------------------------------
// Sample Topology Data: Station → EnergyUnit → BatteryUnit → BatteryCluster → Cell
// -----------------------------------------------------------
CREATE (s1:Station {id: 'ST-001', name: '通海储能站', location: '上海浦东', capacity: 500.0, status: 'ONLINE'})

CREATE (eu1:EnergyUnit {id: 'EU-001', name: '储能单元1', capacity: 250.0})
CREATE (eu2:EnergyUnit {id: 'EU-002', name: '储能单元2', capacity: 250.0})

CREATE (bu1:BatteryUnit {id: 'BU-001', name: '电池柜1', containerNo: 1})
CREATE (bu2:BatteryUnit {id: 'BU-002', name: '电池柜2', containerNo: 2})
CREATE (bu3:BatteryUnit {id: 'BU-003', name: '电池柜3', containerNo: 3})
CREATE (bu4:BatteryUnit {id: 'BU-004', name: '电池柜4', containerNo: 4})

CREATE (cl1:BatteryCluster {id: 'CL-001', name: '集群1', clusterNo: 1})
CREATE (cl2:BatteryCluster {id: 'CL-002', name: '集群2', clusterNo: 2})
CREATE (cl3:BatteryCluster {id: 'CL-003', name: '集群3', clusterNo: 3})
CREATE (cl4:BatteryCluster {id: 'CL-004', name: '集群4', clusterNo: 4})

CREATE (eu1)-[:BELONGS_TO]->(s1)
CREATE (eu2)-[:BELONGS_TO]->(s1)
CREATE (bu1)-[:BELONGS_TO]->(eu1)
CREATE (bu2)-[:BELONGS_TO]->(eu1)
CREATE (bu3)-[:BELONGS_TO]->(eu2)
CREATE (bu4)-[:BELONGS_TO]->(eu2)
CREATE (cl1)-[:BELONGS_TO]->(bu1)
CREATE (cl2)-[:BELONGS_TO]->(bu2)
CREATE (cl3)-[:BELONGS_TO]->(bu3)
CREATE (cl4)-[:BELONGS_TO]->(bu4)

// Sample Cells
FOREACH (i IN RANGE(1, 100) |
  CREATE (c:Cell {id: 'CELL-' + i, cellNo: i, voltage: 3.2 + rand()*0.2, current: 50.0 - rand()*5, temperature: 25.0 + rand()*3, soc: 50.0 + rand()*30, soh: 85.0 + rand()*12})
  MERGE (cl:BatteryCluster {id: 'CL-00' + CASE WHEN i <= 25 THEN '1' WHEN i <= 50 THEN '2' WHEN i <= 75 THEN '3' ELSE '4' END})
  CREATE (c)-[:BELONGS_TO]->(cl)
)

// Sample PCS & Transformer
CREATE (pcs1:PCS {id: 'PCS-001', name: 'PCS-1', cumulativeEfficiency: 0.95, dailyEfficiency: 0.93})
CREATE (pcs2:PCS {id: 'PCS-002', name: 'PCS-2', cumulativeEfficiency: 0.94, dailyEfficiency: 0.92})
CREATE (tf1:Transformer {id: 'TF-001', name: '变压器1', cumulativeEfficiency: 0.98, dailyEfficiency: 0.97})
CREATE (tf2:Transformer {id: 'TF-002', name: '变压器2', cumulativeEfficiency: 0.97, dailyEfficiency: 0.96})
CREATE (pcs1)-[:BELONGS_TO]->(eu1)
CREATE (pcs2)-[:BELONGS_TO]->(eu2)
CREATE (tf1)-[:BELONGS_TO]->(eu1)
CREATE (tf2)-[:BELONGS_TO]->(eu2)

// -----------------------------------------------------------
// Sample User / Role / Menu
// -----------------------------------------------------------
CREATE (admin:User {id: 'U-001', username: 'admin', password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Kz2aGP0r0JhBJBJBJBJBJ', displayName: '管理员', enabled: true})
CREATE (operator:User {id: 'U-002', username: 'operator', password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Kz2aGP0r0JhBJBJBJBJBJ', displayName: '运维员', enabled: true})
CREATE (viewer:User {id: 'U-003', username: 'viewer', password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Kz2aGP0r0JhBJBJBJBJBJ', displayName: '观察者', enabled: true})

CREATE (roleAdmin:Role {id: 'R-001', name: '管理员', code: 'ADMIN'})
CREATE (roleOperator:Role {id: 'R-002', name: '运维员', code: 'OPERATOR'})
CREATE (roleViewer:Role {id: 'R-003', name: '观察者', code: 'VIEWER'})

CREATE (menu1:Menu {id: 'M-001', name: '总览', path: '/dashboard', icon: 'DashboardOutlined', sort: 1, parentId: null})
CREATE (menu2:Menu {id: 'M-002', name: '实时监控', path: '/monitor', icon: 'MonitorOutlined', sort: 2, parentId: null})
CREATE (menu3:Menu {id: 'M-003', name: '告警管理', path: '/alarm', icon: 'AlertOutlined', sort: 3, parentId: null})
CREATE (menu4:Menu {id: 'M-004', name: '电池诊所', path: '/clinic', icon: 'MedicineBoxOutlined', sort: 4, parentId: null})
CREATE (menu5:Menu {id: 'M-005', name: '运维管理', path: '/om', icon: 'ToolOutlined', sort: 5, parentId: null})
CREATE (menu6:Menu {id: 'M-006', name: '系统设置', path: '/settings', icon: 'SettingOutlined', sort: 6, parentId: null})

CREATE (admin)-[:HAS_ROLE]->(roleAdmin)
CREATE (operator)-[:HAS_ROLE]->(roleOperator)
CREATE (viewer)-[:HAS_ROLE]->(roleViewer)

CREATE (roleAdmin)-[:HAS_MENU]->(menu1)
CREATE (roleAdmin)-[:HAS_MENU]->(menu2)
CREATE (roleAdmin)-[:HAS_MENU]->(menu3)
CREATE (roleAdmin)-[:HAS_MENU]->(menu4)
CREATE (roleAdmin)-[:HAS_MENU]->(menu5)
CREATE (roleAdmin)-[:HAS_MENU]->(menu6)
CREATE (roleOperator)-[:HAS_MENU]->(menu1)
CREATE (roleOperator)-[:HAS_MENU]->(menu2)
CREATE (roleOperator)-[:HAS_MENU]->(menu3)
CREATE (roleOperator)-[:HAS_MENU]->(menu4)
CREATE (roleOperator)-[:HAS_MENU]->(menu5)
CREATE (roleViewer)-[:HAS_MENU]->(menu1)
CREATE (roleViewer)-[:HAS_MENU]->(menu2)
CREATE (roleViewer)-[:HAS_MENU]->(menu3)
CREATE (roleViewer)-[:HAS_MENU]->(menu4)

// -----------------------------------------------------------
// Sample Alarm Rules
// -----------------------------------------------------------
CREATE (r1:AlarmRule {id: 'AR-001', name: '单体电压过高', condition: 'voltage>3.65', riskType: 'SAFETY', severity: 'CRITICAL', notifyType: 'ALL', enabled: true})
CREATE (r2:AlarmRule {id: 'AR-002', name: '单体电压过低', condition: 'voltage<2.8', riskType: 'SAFETY', severity: 'CRITICAL', notifyType: 'ALL', enabled: true})
CREATE (r3:AlarmRule {id: 'AR-003', name: '温度异常偏高', condition: 'temperature>45', riskType: 'SAFETY', severity: 'WARNING', notifyType: 'SMS', enabled: true})
CREATE (r4:AlarmRule {id: 'AR-004', name: 'SOC过低', condition: 'soc<10', riskType: 'PERFORMANCE', severity: 'WARNING', notifyType: 'EMAIL', enabled: true})
CREATE (r5:AlarmRule {id: 'AR-005', name: 'SOH衰减预警', condition: 'soh<80', riskType: 'LIFECYCLE', severity: 'INFO', notifyType: 'EMAIL', enabled: true})

// -----------------------------------------------------------
// Sample Analog Points
// -----------------------------------------------------------
CREATE (a1:Analog {id: 'AN-001', analogCode: 'V_CELL_001', cellId: 'CELL-1', description: '1号电芯电压', unit: 'V', dataType: 'REAL'})
CREATE (a2:Analog {id: 'AN-002', analogCode: 'T_CELL_001', cellId: 'CELL-1', description: '1号电芯温度', unit: '°C', dataType: 'REAL'})
CREATE (a3:Analog {id: 'AN-003', analogCode: 'I_CLUSTER_001', cellId: null, description: '1号集群电流', unit: 'A', dataType: 'REAL'})
CREATE (a1)-[:MAPPED_IN]->(s1)
CREATE (a2)-[:MAPPED_IN]->(s1)
CREATE (a3)-[:MAPPED_IN]->(s1)
