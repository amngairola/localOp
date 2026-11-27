'use client';

import React, { useState, useEffect } from 'react';
import { CategorySpending, DailySpending } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface ExpenseChartsProps {
  categoryBreakdown: CategorySpending[];
  dailyTrends: DailySpending[];
  currency?: string;
}

const COLORS = [
  '#0284c7', // Sky
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#64748b', // Slate
];

export function ExpenseCharts({
  categoryBreakdown,
  dailyTrends,
  currency = 'INR',
}: ExpenseChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-xl bg-slate-50 border border-slate-200 animate-pulse" />
        <div className="h-72 rounded-xl bg-slate-50 border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const pieData = categoryBreakdown.map((item) => ({
    name: item.category.replace('_', ' '),
    value: item.totalAmount,
    percentage: item.percentage,
  }));

  const trendData = dailyTrends.map((d) => ({
    date: d.date.slice(5), // MM-DD
    amount: d.amount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Breakdown Donut Chart */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-sky-600" />
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          </div>
          <CardDescription>Distribution of expenses for selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-400">
              No expense transactions recorded in this period
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: any) => [
                      `₹${Number(value).toLocaleString('en-IN')}`,
                      'Amount',
                    ]}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600 mt-2">
                {pieData.slice(0, 5).map((entry, idx) => (
                  <span key={entry.name} className="flex items-center gap-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    {entry.name} ({entry.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Spending Trend Chart */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base font-semibold">Daily Spending Trend</CardTitle>
          </div>
          <CardDescription>Daily expenditure across the month</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-400">
              No daily spending activity recorded
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
