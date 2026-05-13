import React from 'react';
import { Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

export default function DemoModeBanner() {
  return (
    <Alert
      message="演示模式"
      description="当前显示的是模拟数据，非真实设备数据。部分功能可能不可用。"
      type="warning"
      icon={<WarningOutlined />}
      showIcon
      banner
      closable
      className="mb-4"
    />
  );
}
