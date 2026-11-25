'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Receipt,
  CreditCard,
  DollarSign,
  Bot,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function AuthenticatedDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your personal life operations hub is connected to your private account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/assistant">
            <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-sm shadow-sm">
              <Bot className="h-4 w-4" />
              Ask LifeOps AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Data Empty / Active State Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Reminders</CardTitle>
            <Bell className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0 Active</div>
            <p className="text-xs text-slate-500 mt-1">No overdue alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Unpaid Bills</CardTitle>
            <Receipt className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹0.00</div>
            <p className="text-xs text-slate-500 mt-1">All bills up to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0 Tracked</div>
            <p className="text-xs text-slate-500 mt-1">Add to monitor renewals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Month Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹0.00</div>
            <p className="text-xs text-slate-500 mt-1">Current billing period</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launchpad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>Add new responsibilities to your personal ledger</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/reminders">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-sky-600" />
                Add Reminder
              </Button>
            </Link>
            <Link href="/bills">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-amber-600" />
                Record Bill
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-purple-600" />
                Track Subscription
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="outline" className="w-full justify-start gap-2 text-xs border-slate-200">
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                Log Expense
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-sky-950 text-white border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-sky-400 text-sky-300 text-xs">
                AI Ready
              </Badge>
            </div>
            <CardTitle className="text-lg text-white">Ask LifeOps Assistant</CardTitle>
            <CardDescription className="text-slate-300">
              Your assistant executes tool calls directly against your private PostgreSQL database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-white/10 p-3 text-xs text-slate-200">
              Try asking: &ldquo;Show me all upcoming reminders for next week&rdquo;
            </div>
            <Link href="/assistant">
              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white gap-2 text-xs w-full">
                Open Assistant Chat
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
