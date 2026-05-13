package com.battery.platform.api.repository.mysql;

import com.battery.platform.api.entity.mysql.BillElectricity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillElectricityRepository extends JpaRepository<BillElectricity, Long> {
    Page<BillElectricity> findByStationIdAndBillMonth(String stationId, String billMonth, Pageable pageable);
    Page<BillElectricity> findByStationId(String stationId, Pageable pageable);
}
