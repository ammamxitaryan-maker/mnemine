"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Activity } from '@/hooks/useActivityData';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface EarningsChartProps {
  activity: Activity[];
}

const processChartData = (activity: Activity[]) => {
  if (!activity || activity.length === 0) {
    return [];
  }

  // Sort activities from oldest to newest
  const sortedActivity = [...activity].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let cumulativeBalance = 0;
  const dataMap = new Map<string, number>();

  // Add a starting point for the chart
  if (sortedActivity.length > 0) {
      const firstDate = new Date(sortedActivity[0].createdAt);
      firstDate.setDate(firstDate.getDate() - 1);
      dataMap.set(format(firstDate, 'MMM d'), 0);
  }

  sortedActivity.forEach(log => {
    cumulativeBalance += log.amount;
    const date = format(new Date(log.createdAt), 'MMM d');
    dataMap.set(date, cumulativeBalance);
  });

  return Array.from(dataMap, ([name, balance]) => ({
    name,
    balance: parseFloat(balance.toFixed(4)),
  }));
};

export const EarningsChart = ({ activity }: EarningsChartProps) => {
  const { t } = useTranslation(); // Initialize useTranslation
  const chartData = useMemo(() => processChartData(activity), [activity]);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Not enough data to display a chart.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--primary))',
              color: 'hsl(var(--foreground))',
              borderRadius: 'var(--radius)',
              padding: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <Legend className="pt-2 text-sm" />
          <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} name={t('balance') + ' (USD)'} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
