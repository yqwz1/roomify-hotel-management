import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForecastChart from './ForecastChart';

const { trendChartSpy } = vi.hoisted(() => ({ trendChartSpy: vi.fn() }));

vi.mock('../charts/TrendLineChart', () => ({
  TrendLineChart: (props) => {
    trendChartSpy(props);
    return <div data-testid="trend-line-chart" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (key === 'chart.pointsLoaded' ? `${options.count} points loaded` : key),
    i18n: { language: 'en' },
  }),
}));

describe('ForecastChart prediction intervals', () => {
  beforeEach(() => trendChartSpy.mockClear());

  it('maps lower and upper forecast values into a chart range', () => {
    render(
      <ForecastChart
        title="Revenue forecast"
        description="Forecast with uncertainty."
        data={[
          {
            date: '2026-05-22',
            predictedRevenue: 12320,
            predictedRevenueLower: 12200,
            predictedRevenueUpper: 12450,
          },
        ]}
        valueKey="predictedRevenue"
        lowerValueKey="predictedRevenueLower"
        upperValueKey="predictedRevenueUpper"
        intervalLevel={0.8}
      />
    );

    expect(screen.getByText('80% model spread interval')).toBeInTheDocument();
    const chartProps = trendChartSpy.mock.calls.at(-1)[0];
    expect(chartProps.rangeKey).toBe('interval');
    expect(chartProps.data[0].interval).toEqual([12200, 12450]);
  });

  it('does not advertise an interval when the payload has no bounds', () => {
    render(
      <ForecastChart
        title="Fallback forecast"
        description="Fallback payload."
        data={[{ date: '2026-05-22', predictedRevenue: 12320 }]}
        valueKey="predictedRevenue"
        lowerValueKey="predictedRevenueLower"
        upperValueKey="predictedRevenueUpper"
      />
    );

    expect(screen.queryByText(/model spread interval/i)).not.toBeInTheDocument();
    expect(trendChartSpy.mock.calls.at(-1)[0].rangeKey).toBeUndefined();
  });
});
