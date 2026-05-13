import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangeFilterProps {
  onChange: (dates: [string, string] | null) => void;
  className?: string;
}

export default function DateRangeFilter({ onChange, className }: DateRangeFilterProps) {
  return (
    <RangePicker
      className={className}
      presets={[
        { label: '今天', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
        { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
        { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
        { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
      ]}
      onChange={(dates) => {
        if (dates) {
          onChange([dates[0]!.toISOString(), dates[1]!.toISOString()]);
        } else {
          onChange(null);
        }
      }}
    />
  );
}
