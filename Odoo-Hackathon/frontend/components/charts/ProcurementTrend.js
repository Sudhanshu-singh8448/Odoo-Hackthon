'use client';
import SpendingChart from './SpendingChart';

export default function ProcurementTrend({ data = [] }) {
  return <SpendingChart data={data} dataKey="total" />;
}
