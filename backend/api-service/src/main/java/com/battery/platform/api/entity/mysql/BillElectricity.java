package com.battery.platform.api.entity.mysql;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "data_bill_electricity")
public class BillElectricity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "station_id") private String stationId;
    @Column(name = "bill_month") private String billMonth;
    @Column(name = "charge_amount") private BigDecimal chargeAmount;
    @Column(name = "discharge_amount") private BigDecimal dischargeAmount;
    @Column(name = "charge_cost") private BigDecimal chargeCost;
    @Column(name = "discharge_revenue") private BigDecimal dischargeRevenue;
    @Column(name = "net_profit") private BigDecimal netProfit;
    @Column(name = "created_at") private LocalDate createdAt;
}
