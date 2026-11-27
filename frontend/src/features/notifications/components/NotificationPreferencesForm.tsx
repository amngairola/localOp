'use client';

import React, { useState, useEffect } from 'react';
import {
  useNotificationPreferences,
  useUpdatePreferences,
} from '../hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  Mail,
  Clock,
  Moon,
  AlertTriangle,
  Receipt,
  CreditCard,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export function NotificationPreferencesForm() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdatePreferences();

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(60);
  const [billLeadDays, setBillLeadDays] = useState(3);
  const [subscriptionLeadDays, setSubscriptionLeadDays] = useState(7);
  const [trialLeadDays, setTrialLeadDays] = useState(3);
  const [budgetThresholdPercent, setBudgetThresholdPercent] = useState(80);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (prefs) {
      setEmailEnabled(prefs.emailEnabled);
      setInAppEnabled(prefs.inAppEnabled);
      setReminderLeadMinutes(prefs.reminderLeadMinutes);
      setBillLeadDays(prefs.billLeadDays);
      setSubscriptionLeadDays(prefs.subscriptionLeadDays);
      setTrialLeadDays(prefs.trialLeadDays);
      setBudgetThresholdPercent(prefs.budgetThresholdPercent);
      setQuietHoursEnabled(prefs.quietHoursEnabled);
      setQuietHoursStart(prefs.quietHoursStart || '22:00');
      setQuietHoursEnd(prefs.quietHoursEnd || '08:00');
    }
  }, [prefs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        emailEnabled,
        inAppEnabled,
        reminderLeadMinutes,
        billLeadDays,
        subscriptionLeadDays,
        trialLeadDays,
        budgetThresholdPercent,
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? quietHoursStart : null,
        quietHoursEnd: quietHoursEnabled ? quietHoursEnd : null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
          <p className="text-xs">Loading notification preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Notification preferences updated successfully!</span>
        </div>
      )}

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Delivery Channels</CardTitle>
          <CardDescription>Choose how you would like to receive reminders and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-sky-600" />
              <div>
                <span className="text-sm font-medium text-slate-900 block">In-App Notifications</span>
                <span className="text-xs text-slate-500">Show notification bell alerts and dashboard banners</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={inAppEnabled}
              onChange={(e) => setInAppEnabled(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-sm font-medium text-slate-900 block">Email Alerts</span>
                <span className="text-xs text-slate-500">Receive urgent bill deadlines, subscription renewals, and reminders via email</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </label>
        </CardContent>
      </Card>

      {/* Lead Times */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Alert Timing & Lead Windows</CardTitle>
          <CardDescription>Configure how far in advance alerts should be generated</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reminder Lead Time
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="5"
                max="1440"
                value={reminderLeadMinutes}
                onChange={(e) => setReminderLeadMinutes(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500">minutes before due date</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Bill Due Warning
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="30"
                value={billLeadDays}
                onChange={(e) => setBillLeadDays(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500">days before bill is due</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subscription Renewal Alert
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="30"
                value={subscriptionLeadDays}
                onChange={(e) => setSubscriptionLeadDays(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500">days before renewal</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Free Trial Expiration Warning
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="14"
                value={trialLeadDays}
                onChange={(e) => setTrialLeadDays(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500">days before trial ends</span>
            </div>
          </div>

          <div className="md:col-span-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Budget Warning Threshold
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={budgetThresholdPercent}
                onChange={(e) => setBudgetThresholdPercent(Number(e.target.value))}
                className="w-64 accent-sky-600"
              />
              <span className="text-sm font-bold text-slate-800">{budgetThresholdPercent}%</span>
              <span className="text-xs text-slate-400">(alert when category reaches this percentage)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold">Quiet Hours</CardTitle>
          </div>
          <CardDescription>Suppress email notifications during sleep or focus hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="text-sm font-medium text-slate-900 block">Enable Quiet Hours</span>
              <span className="text-xs text-slate-500">In-app notifications will still be logged silently</span>
            </div>
            <input
              type="checkbox"
              checked={quietHoursEnabled}
              onChange={(e) => setQuietHoursEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </label>

          {quietHoursEnabled && (
            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
              <span className="text-slate-400 mt-4">to</span>
              <div>
                <label className="block text-xs text-slate-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
        >
          {updateMutation.isPending ? 'Saving Preferences...' : 'Save Notification Preferences'}
        </Button>
      </div>
    </form>
  );
}
