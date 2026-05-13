/** 风险等级权重映射 */
export const riskWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

/** 风险等级优先级映射（别名，语义更清晰） */
export const riskPriority: Record<string, number> = riskWeight;

/** 根据风险等级返回状态圆点 CSS 类名 */
export const getRiskDotClass = (level: string): string => {
  if (level === 'high') {
    return 'console-status-pill__dot--danger';
  }

  if (level === 'medium') {
    return 'console-status-pill__dot--warning';
  }

  return 'console-status-pill__dot--success';
};
