// ============================================================
// Battery Health Platform - InfluxDB Setup
// ============================================================

// Create bucket (run via influx CLI or API)
// influx bucket create -n battery_measure -o battery --retention 90d

// -----------------------------------------------------------
// Downsample Task: 5-minute aggregates
// -----------------------------------------------------------
option task = {name: "downsample-5m", every: 5m}

from(bucket: "battery_measure")
    |> range(start: -task.every)
    |> filter(fn: (r) => r._measurement == "cell_measure")
    |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
    |> to(bucket: "battery_measure_5m", org: "battery")

// -----------------------------------------------------------
// Downsample Task: 15-minute aggregates
// -----------------------------------------------------------
option task = {name: "downsample-15m", every: 15m}

from(bucket: "battery_measure_5m")
    |> range(start: -task.every)
    |> filter(fn: (r) => r._measurement == "cell_measure")
    |> aggregateWindow(every: 15m, fn: mean, createEmpty: false)
    |> to(bucket: "battery_measure_15m", org: "battery")

// -----------------------------------------------------------
// Downsample Task: 1-day aggregates
// -----------------------------------------------------------
option task = {name: "downsample-1d", every: 1d}

from(bucket: "battery_measure_15m")
    |> range(start: -task.every)
    |> filter(fn: (r) => r._measurement == "cell_measure")
    |> aggregateWindow(every: 1d, fn: mean, createEmpty: false)
    |> to(bucket: "battery_measure_1d", org: "battery")
