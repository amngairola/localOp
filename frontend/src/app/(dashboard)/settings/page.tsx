'use client';

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationPreferencesForm } from '@/features/notifications/components/NotificationPreferencesForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Bell, Key, Database } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings & Preferences</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal account, notifications, background alerts, and privacy.
        </p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-sky-600" />
            <CardTitle className="text-base font-semibold">User Profile</CardTitle>
          </div>
          <CardDescription>Your authenticated Supabase identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Full Name
              </span>
              <p className="font-semibold text-slate-800 mt-1">
                {user?.user_metadata?.full_name || 'Personal Account'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Email Address
              </span>
              <p className="font-semibold text-slate-800 mt-1">{user?.email || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Account ID
              </span>
              <p className="font-mono text-xs text-slate-600 mt-1 truncate">{user?.id || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Auth Provider
              </span>
              <p className="font-semibold text-slate-800 mt-1">
                {user?.app_metadata?.provider || 'Supabase OAuth'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-sky-600" />
          <h2 className="text-lg font-bold text-slate-900">Notification Settings</h2>
        </div>
        <NotificationPreferencesForm />
      </div>

      {/* Data & Security Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base font-semibold">Security & Architecture</CardTitle>
          </div>
          <CardDescription>How LifeOps protects your private ledger</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          <p>
            • All queries, reminders, bills, expenses, and documents are cryptographically isolated by your authenticated user ID.
          </p>
          <p>
            • Vault files are stored in user-scoped folders on Supabase Storage and accessed strictly via short-lived signed URLs.
          </p>
          <p>
            • Scheduled notification checks run idempotently to prevent duplicate alerts and respect quiet hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
