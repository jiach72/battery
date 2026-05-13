package com.battery.platform.api.service;

import com.battery.platform.api.entity.mysql.BillElectricity;
import com.battery.platform.api.repository.mysql.BillElectricityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillElectricityRepository billElectricityRepository;

    public Page<BillElectricity> getElectricity(String stationId, String month, Pageable pageable) {
        if (month != null && !month.isBlank()) {
            return billElectricityRepository.findByStationIdAndBillMonth(stationId, month, pageable);
        }
        return billElectricityRepository.findByStationId(stationId, pageable);
    }
}
