package com.battery.platform.api.repository.influx;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Repository
@RequiredArgsConstructor
public class InfluxMeasurementRepository {

    private final InfluxDBClient influxDBClient;
    private static final String BUCKET = "battery_measure";

    /** 允许的 tag 值字符: 字母、数字、下划线、中划线、中文 */
    private static final Pattern SAFE_TAG_VALUE = Pattern.compile("^[\\w\\u4e00-\\u9fa5-]+$");

    private static String sanitizeTagValue(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " 不能为空");
        }
        if (!SAFE_TAG_VALUE.matcher(value).matches()) {
            throw new IllegalArgumentException(fieldName + " 包含非法字符: " + value);
        }
        return value;
    }

    /**
     * 查询实时量测数据（最新一条）
     */
    public List<Map<String, Object>> queryLatestMeasurements(String stationId, String energyUnitId, int limit) {
        String safeStationId = sanitizeTagValue(stationId, "stationId");
        String safeEnergyUnitId = sanitizeTagValue(energyUnitId, "energyUnitId");
        if (limit < 1 || limit > 10000) {
            throw new IllegalArgumentException("limit 超出合法范围 [1, 10000]");
        }
        String flux = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: -5m) " +
            "|> filter(fn: (r) => r[\"_measurement\"] =~ /^量测表/) " +
            "|> filter(fn: (r) => r[\"station_id\"] == \"%s\") " +
            "|> filter(fn: (r) => r[\"energy_unit_id\"] == \"%s\") " +
            "|> last() " +
            "|> limit(n: %d)",
            BUCKET, safeStationId, safeEnergyUnitId, limit
        );
        return executeQuery(flux);
    }

    /**
     * 查询时间范围量测数据
     */
    public List<Map<String, Object>> queryMeasurementsByRange(
            String stationId, String clusterId,
            Instant start, Instant stop, String granularity) {
        String safeStationId = sanitizeTagValue(stationId, "stationId");
        String safeClusterId = sanitizeTagValue(clusterId, "clusterId");
        String bucket = getBucketForGranularity(granularity);
        String flux = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: %s, stop: %s) " +
            "|> filter(fn: (r) => r[\"_measurement\"] =~ /^量测表/) " +
            "|> filter(fn: (r) => r[\"station_id\"] == \"%s\") " +
            "|> filter(fn: (r) => r[\"cluster_id\"] == \"%s\")",
            bucket, start.toString(), stop.toString(), safeStationId, safeClusterId
        );
        return executeQuery(flux);
    }

    /**
     * 查询聚合数据（5min/15min/1day 粒度）
     */
    public List<Map<String, Object>> queryAggregatedData(
            String stationId, String energyUnitId,
            Instant start, Instant stop, String aggregation) {
        String safeStationId = sanitizeTagValue(stationId, "stationId");
        String safeEnergyUnitId = sanitizeTagValue(energyUnitId, "energyUnitId");
        String bucket = getBucketForGranularity(aggregation);
        String flux = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: %s, stop: %s) " +
            "|> filter(fn: (r) => r[\"_measurement\"] =~ /^量测表/) " +
            "|> filter(fn: (r) => r[\"station_id\"] == \"%s\") " +
            "|> filter(fn: (r) => r[\"energy_unit_id\"] == \"%s\")",
            bucket, start.toString(), stop.toString(), safeStationId, safeEnergyUnitId
        );
        return executeQuery(flux);
    }

    private String getBucketForGranularity(String granularity) {
        return switch (granularity) {
            case "5min" -> BUCKET + "_5min";
            case "15min" -> BUCKET + "_15min";
            case "1day" -> BUCKET + "_1day";
            default -> BUCKET;
        };
    }

    /**
     * 查询站点下每个单体的最新量测值
     */
    public List<Map<String, Object>> queryLatestPerCell(String stationId) {
        String safeStationId = sanitizeTagValue(stationId, "stationId");
        String flux = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: -5m) " +
            "|> filter(fn: (r) => r[\"_measurement\"] =~ /^量测表/) " +
            "|> filter(fn: (r) => r[\"station_id\"] == \"%s\") " +
            "|> filter(fn: (r) => r[\"_field\"] == \"voltage\" or r[\"_field\"] == \"temperature\" or r[\"_field\"] == \"soh\") " +
            "|> last() " +
            "|> pivot(rowKey: [\"_time\"], columnKey: [\"_field\"], valueColumn: \"_value\") " +
            "|> keep(columns: [\"cell_id\", \"voltage\", \"temperature\", \"soh\", \"_time\"])",
            BUCKET, safeStationId
        );
        return executeQuery(flux);
    }

    /**
     * 查询单体指定指标的时间序列数据
     */
    public List<Map<String, Object>> queryCellTimeSeries(String cellId, String field, Instant start, Instant stop) {
        String safeCellId = sanitizeTagValue(cellId, "cellId");
        String flux = String.format(
            "from(bucket: \"%s\") " +
            "|> range(start: %s, stop: %s) " +
            "|> filter(fn: (r) => r[\"_measurement\"] =~ /^量测表/) " +
            "|> filter(fn: (r) => r[\"cell_id\"] == \"%s\") " +
            "|> filter(fn: (r) => r[\"_field\"] == \"%s\") " +
            "|> aggregateWindow(every: 5m, fn: mean) " +
            "|> limit(n: 500)",
            BUCKET, start.toString(), stop.toString(), safeCellId, field
        );
        return executeQuery(flux);
    }

    private List<Map<String, Object>> executeQuery(String flux) {
        QueryApi queryApi = influxDBClient.getQueryApi();
        List<FluxTable> tables = queryApi.query(flux);
        List<Map<String, Object>> results = new ArrayList<>();
        for (FluxTable table : tables) {
            for (FluxRecord record : table.getRecords()) {
                Map<String, Object> row = new HashMap<>();
                row.put("time", record.getTime());
                row.put("measurement", record.getMeasurement());
                row.put("field", record.getField());
                row.put("value", record.getValue());
                record.getValues().forEach((k, v) -> {
                    if (!k.startsWith("_") && !k.equals("result") && !k.equals("table")) {
                        row.put(k, v);
                    }
                });
                results.add(row);
            }
        }
        return results;
    }
}
