import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RiskBadge from '../RiskBadge';

describe('RiskBadge', () => {
  it('renders high risk badge', () => {
    render(<RiskBadge severity="high" />);
    expect(screen.getByText('高风险')).toBeInTheDocument();
  });

  it('renders medium risk badge', () => {
    render(<RiskBadge severity="medium" />);
    expect(screen.getByText('中风险')).toBeInTheDocument();
  });

  it('renders low risk badge', () => {
    render(<RiskBadge severity="low" />);
    expect(screen.getByText('低风险')).toBeInTheDocument();
  });
});
