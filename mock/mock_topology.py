"""电站拓扑关系生成器"""
import json
import uuid
import random


def generate_topology(num_stations=1, units_per_station=2, containers_per_unit=2,
                      clusters_per_container=4, cells_per_cluster=26):
    """生成完整电站拓扑"""
    topology = []
    for s in range(num_stations):
        station = {
            "id": f"station-{s+1}",
            "name": f"{['示范', '浦东', '虹桥'][s % 3]}储能电站",
            "location": f"上海市{['浦东新区', '闵行区', '嘉定区'][s % 3]}",
            "capacity": 500.0,
            "status": "online",
            "energyUnits": [],
        }
        for u in range(units_per_station):
            unit = {
                "id": f"eu-{s+1}-{u+1}",
                "name": f"{u+1}号储能单元",
                "capacity": station["capacity"] / units_per_station,
                "batteryUnits": [],
            }
            for b in range(containers_per_unit):
                bu = {
                    "id": f"bu-{s+1}-{u+1}-{b+1}",
                    "name": f"{b+1}号电池舱",
                    "containerNo": b + 1,
                    "clusters": [],
                }
                for c in range(clusters_per_container):
                    cluster = {
                        "id": f"bc-{s+1}-{u+1}-{b+1}-{c+1}",
                        "name": f"{c+1}号簇",
                        "clusterNo": c + 1,
                        "cells": [],
                    }
                    for i in range(cells_per_cluster):
                        cluster["cells"].append({
                            "id": f"cell-{s+1}-{u+1}-{b+1}-{c+1}-{i+1}",
                            "cellNo": i + 1,
                            "voltage": round(3.2 + random.uniform(0, 0.2), 3),
                            "current": round(random.uniform(40, 60), 1),
                            "temperature": round(25 + random.uniform(0, 10), 1),
                            "soc": round(random.uniform(20, 100), 1),
                            "soh": round(random.uniform(80, 100), 1),
                        })
                    bu["clusters"].append(cluster)
                unit["batteryUnits"].append(bu)
            station["energyUnits"].append(unit)
        topology.append(station)
    return topology


if __name__ == "__main__":
    data = generate_topology()
    with open("mock_topology_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Generated {len(data)} stations with {sum(len(s['energyUnits']) for s in data)} units")
