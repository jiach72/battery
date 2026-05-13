import React from 'react';
import { Empty, Button } from 'antd';

interface PageEmptyProps {
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/**
 * 统一空状态组件 - 提供引导性操作而非仅 "暂无数据"
 */
export default function PageEmpty({
  description = '暂无数据',
  actionText,
  onAction,
  icon,
}: PageEmptyProps) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label={description}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span className="console-empty-state text-[13px]">{description}</span>
        }
        className="console-empty-card"
      >
        {actionText && onAction && (
          <Button type="primary" size="small" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
