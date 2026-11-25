'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  CreditCard,
  CheckCircle2,
  Receipt,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Bot,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  demoSummary,
  demoMonthlyExpenses,
  demoCategoryExpenses,
  demoReminders,
  demoBills,
  demoSubscriptions,
  demoExpenses,
  demoTasks,
} from '@/constants/demoData';

export default function PublicDashboardPage() {
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'reminders' | 'bills' | 'subscriptions' | 'expenses'>('reminders');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">LifeOps</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-xs font-medium border-amber-200">
                  Demo Preview
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">AI Personal Life Management Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-28 animate-pulse rounded-md bg-slate-200" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-sm">
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-slate-600 hover:text-slate-900 border-slate-300"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => signInWithGoogle()}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign In with Google
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Demo Notice Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 border-b border-sky-100 py-3 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium text-slate-900">Public Demo Mode:</span>
            <span>You are previewing LifeOps with realistic demo data. No real records are exposed.</span>
          </div>
          <button
            onClick={() => signInWithGoogle()}
            className="text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 hover:underline"
          >
            Sign in with Google to manage your personal life
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Container ─────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 space-y-8 w-full">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Personal Overview
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Stay ahead of your obligations, recurring bills, and day-to-day tasks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 py-1.5 px-3">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              November 2026
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 py-1.5 px-3">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              AI Assistant Ready
            </Badge>
          </div>
        </div>

        {/* ── 4 KPI Stats Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Monthly Expenses */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Monthly Spending</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ₹{demoSummary.totalMonthlyExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-medium">On track</span> with monthly budget limit
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Upcoming Bills */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Upcoming Bills</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {demoSummary.upcomingBillsCount} due soon
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total ₹{demoSummary.upcomingBillsAmount.toLocaleString('en-IN')} due before Dec 10
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Active Subscriptions */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Subscriptions</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {demoSummary.activeSubscriptionsCount} services
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ₹{demoSummary.activeSubscriptionsMonthly.toLocaleString('en-IN')}/month recurring
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Upcoming Reminders */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Responsibilities</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {demoSummary.upcomingRemindersCount} Reminders
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Plus {demoSummary.pendingTasksCount} everyday tasks scheduled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Analytics & Spending Charts Row ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Spending Trend Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Spending Trends (Last 6 Months)</CardTitle>
                  <CardDescription>Aggregated spending data from PostgreSQL</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-slate-600">
                  Demo Ledger
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demoMonthlyExpenses} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#64748b"
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Total Spent']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {demoMonthlyExpenses.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === demoMonthlyExpenses.length - 1 ? '#0284c7' : '#94a3b8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
              <CardDescription>Current month distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoCategoryExpenses.map((category) => {
                const percent = Math.round((category.amount / demoSummary.totalMonthlyExpenses) * 100);
                return (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{category.name}</span>
                      <span className="text-slate-500">₹{category.amount.toLocaleString('en-IN')} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: category.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Interactive Tabbed Modules Section ───────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reminders'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Bell className="h-4 w-4" />
                Upcoming Reminders ({demoReminders.length})
              </button>
              <button
                onClick={() => setActiveTab('bills')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'bills'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Receipt className="h-4 w-4" />
                Bills & Invoices ({demoBills.length})
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'subscriptions'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Subscriptions ({demoSubscriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'expenses'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Recent Expenses
              </button>
            </div>
            <span className="text-xs text-slate-500 italic">Showing static demo records</span>
          </div>

          {/* Tab 1: Reminders */}
          {activeTab === 'reminders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoReminders.map((rem) => (
                <Card key={rem.id} className="border-l-4 border-l-sky-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{rem.title}</span>
                          <Badge
                            variant={rem.priority === 'URGENT' ? 'urgent' : rem.priority === 'HIGH' ? 'warning' : 'secondary'}
                          >
                            {rem.priority}
                          </Badge>
                        </div>
                        {rem.description && (
                          <p className="text-xs text-slate-500">{rem.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1 text-sky-700 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Due: {new Date(rem.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {rem.recurrenceType !== 'NONE' && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                              {rem.recurrenceType}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rem.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 2: Bills */}
          {activeTab === 'bills' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoBills.map((bill) => (
                <Card key={bill.id} className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-sm text-slate-900">{bill.title}</span>
                      <Badge variant="warning">{bill.status}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>Provider: <span className="font-medium text-slate-700">{bill.provider}</span></div>
                      <div>Due date: <span className="font-medium text-amber-700">{new Date(bill.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                      {bill.notes && <div className="text-slate-400 italic">{bill.notes}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 3: Subscriptions */}
          {activeTab === 'subscriptions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {demoSubscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-sm">{sub.name}</span>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      ₹{sub.amount.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/{sub.billingCycle.toLowerCase()}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Renewal: <span className="font-medium text-slate-700">{new Date(sub.nextRenewal).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 4: Expenses */}
          {activeTab === 'expenses' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Expense Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demoExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{exp.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{exp.paymentMethod || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── AI Assistant Natural Language Capability Showcase ────────────── */}
        <Card className="bg-gradient-to-br from-sky-900 via-slate-900 to-indigo-950 text-white border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-sky-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">AI Assistant Feature Spotlight</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-white font-bold">
              Control Your Life Responsibilities via Natural Language
            </CardTitle>
            <CardDescription className="text-slate-300">
              LifeOps connects Groq tool calling with your PostgreSQL database. The AI validates every command through strict backend services.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/10 p-4 border border-white/10 backdrop-blur-sm">
              <div className="text-xs font-medium text-sky-300 mb-1">Prompt Example:</div>
              <p className="text-sm italic text-slate-100 font-serif">
                &ldquo;Remind me to pay my electricity bill on the 5th of next month.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Invokes <code className="bg-black/30 px-1 py-0.5 rounded text-sky-200">create_reminder</code> tool with Zod validation</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 border border-white/10 backdrop-blur-sm">
              <div className="text-xs font-medium text-sky-300 mb-1">Prompt Example:</div>
              <p className="text-sm italic text-slate-100 font-serif">
                &ldquo;How much did I spend this month and which subscriptions are renewing this week?&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Queries aggregated PostgreSQL totals scoped strictly to the authenticated user</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action for Visitors */}
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Ready to organize your personal operations?
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Sign in securely with your Google account. Your records are isolated with PostgreSQL constraints, authenticated tokens, and optional Redis caching.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => signInWithGoogle()}
              size="lg"
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-8 shadow-sm"
            >
              Get Started with Google Login
            </Button>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">LifeOps Platform</span>
            <span>—</span>
            <span>Production Full-Stack Architecture</span>
          </div>
          <div>
            Built with Next.js 15, Express, Prisma ORM, Supabase, Groq & Gemini APIs.
          </div>
        </div>
      </footer>
    </div>
  );
}
