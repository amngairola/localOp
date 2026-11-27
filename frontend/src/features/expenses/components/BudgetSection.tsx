'use client';

import React from 'react';
import { BudgetStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react';

interface BudgetSectionProps {
  budgets: BudgetStatus[];
  onAddBudget: () => void;
  onEditBudget: (budget: BudgetStatus) => void;
  onDeleteBudget: (id: string) => void;
  isLoading?: boolean;
}

export function BudgetSection({
  budgets,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  isLoading,
}: BudgetSectionProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-600" />
            <CardTitle className="text-base font-semibold">Monthly Budgets</CardTitle>
          </div>
          <CardDescription>Track spending limits and monitor budget consumption</CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddBudget}
          className="text-xs gap-1.5 border-slate-200"
        >
          <Plus className="h-3.5 w-3.5 text-sky-600" />
          Set Budget
        </Button>
      </CardHeader>

      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Target className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-500 font-medium">No budgets set for this month</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Set spending thresholds to avoid overspending in key categories.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddBudget}
              className="mt-3 text-xs"
            >
              Configure Budget
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const label = b.category ? b.category.replace('_', ' ') : 'Overall Monthly Budget';
              const percent = Math.min(Math.round(b.percentageConsumed), 100);

              let progressColor = 'bg-emerald-500';
              if (b.isExceeded) {
                progressColor = 'bg-rose-500';
              } else if (b.percentageConsumed >= 80) {
                progressColor = 'bg-amber-500';
              }

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Limit: ₹{Number(b.amount).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-slate-600"
                        onClick={() => onEditBudget(b)}
                        title="Edit Budget"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        onClick={() => onDeleteBudget(b.id)}
                        title="Delete Budget"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Spent: ₹{b.spentAmount.toLocaleString('en-IN')}</span>
                      <span>{b.percentageConsumed}%</span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    {b.isExceeded ? (
                      <span className="text-rose-600 font-medium flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="h-3 w-3" />
                        Exceeded by ₹{Math.abs(b.remainingAmount).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium text-[11px]">
                        ₹{b.remainingAmount.toLocaleString('en-IN')} remaining
                      </span>
                    )}

                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        b.isExceeded
                          ? 'border-rose-200 text-rose-700 bg-rose-50'
                          : b.percentageConsumed >= 80
                          ? 'border-amber-200 text-amber-700 bg-amber-50'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {b.isExceeded ? 'Exceeded' : `${100 - percent}% left`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
