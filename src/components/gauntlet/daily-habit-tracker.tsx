/**
 * Daily Habit & Life Routine Dashboard
 * Visualizes:
 * - Trading PnL Card (Day's Gain/Loss, Trades, Win-Rate)
 * - Google Meeting Agenda & Standup Tracker
 * - Core Habits (Workouts, Hydration, Deep Work)
 * - Productivity Score & Voice-Automation triggers
 */

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Activity,
  Flame,
  Sparkles,
  Mic,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabitStore, type HabitItem } from "@/lib/gauntlet/habit-store";
import { toast } from "sonner";

interface DailyHabitTrackerProps {
  onOpenVoice?: () => void;
}

export function DailyHabitTracker({ onOpenVoice }: DailyHabitTrackerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { getTodayLog, toggleHabit, logTradingPnl, logMeeting, addHabitEntry } = useHabitStore();
  const todayLog = getTodayLog();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<HabitItem["category"]>("productivity");
  const [newTarget, setNewTarget] = useState("");

  const [pnlInput, setPnlInput] = useState("");
  const [pnlTrades, setPnlTrades] = useState("1");
  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-pulse">
          <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 h-28" />
          <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 h-28" />
          <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 h-28" />
          <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 h-28" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 h-64 animate-pulse" />
      </div>
    );
  }

  const pnl = todayLog.tradingPnl;
  const isPnlPositive = (pnl?.realized || 0) >= 0;

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addHabitEntry({
      title: newTitle.trim(),
      category: newCategory,
      completed: false,
      value: newTarget.trim() || undefined,
    });

    setNewTitle("");
    setNewTarget("");
    setIsAddingHabit(false);
    toast.success("New daily habit added!");
  };

  const handleSavePnl = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(pnlInput);
    if (isNaN(val)) return;

    logTradingPnl({
      realized: val,
      tradesCount: parseInt(pnlTrades, 10) || 1,
      notes: `Manual entry: ${val >= 0 ? "+" : ""}$${val}`,
    });

    setPnlInput("");
    setIsPnlModalOpen(false);
    toast.success(`Trading PnL updated: ${val >= 0 ? "+" : ""}$${val.toFixed(2)}`);
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    logMeeting({
      title: meetingTitle.trim(),
      time: meetingTime.trim() || "Today",
      actionItem: `Prepare agenda for ${meetingTitle}`,
    });

    setMeetingTitle("");
    setMeetingTime("");
    setIsMeetingModalOpen(false);
    toast.success("Meeting added to daily tracker & synced to calendar hold!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Trading PnL Card */}
        <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-emerald-400" />
              Daily Trading PnL
            </span>
            <button
              onClick={() => setIsPnlModalOpen(true)}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Update
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isPnlPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPnlPositive ? "+" : ""}${pnl?.realized?.toFixed(2) || "0.00"}
            </span>
            {isPnlPositive ? (
              <TrendingUp className="size-4 text-emerald-400 inline" />
            ) : (
              <TrendingDown className="size-4 text-red-400 inline" />
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 truncate">
            {pnl?.tradesCount || 0} trades logged today · {pnl?.notes || "No notes"}
          </p>
        </div>

        {/* Google Meetings Card */}
        <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Calendar className="size-3.5 text-blue-400" />
              Google Meetings
            </span>
            <button
              onClick={() => setIsMeetingModalOpen(true)}
              className="text-[11px] text-blue-400 hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {todayLog.meetingsSummary?.count || 0}
            <span className="text-xs font-normal text-neutral-400 ml-1.5">scheduled</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 truncate">
            {todayLog.meetingsSummary?.upcoming?.[0] || "All clear for today"}
          </p>
        </div>

        {/* Daily Productivity Score */}
        <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Flame className="size-3.5 text-amber-400" />
              Productivity Score
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              {todayLog.productivityScore || 0}%
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${todayLog.productivityScore || 0}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            {todayLog.habits.filter((h) => h.completed).length} of {todayLog.habits.length} habits completed
          </p>
        </div>

        {/* Voice Automation Trigger */}
        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-neutral-900/70 p-4 flex flex-col justify-between backdrop-blur-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-blue-400" />
                Voice-to-Command
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-[11px] text-neutral-300">
              Speak: "Log +$350 NQ scalp" or "Schedule 2 PM review"
            </p>
          </div>
          {onOpenVoice && (
            <Button
              onClick={onOpenVoice}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 mt-2 h-7"
            >
              <Mic className="size-3.5" />
              Speak Command
            </Button>
          )}
        </div>
      </div>

      {/* Habit Checklist Section */}
      <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="size-4 text-emerald-400" />
              Daily Active Routines & Habits ({todayLog.date})
            </h3>
            <p className="text-xs text-neutral-400">
              Auto-tracked and synced with Gauntlet Neural Memory and Voice Assistant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddingHabit(true)}
              variant="outline"
              size="sm"
              className="border-white/10 text-xs text-neutral-300 hover:bg-white/5 gap-1.5 h-8"
            >
              <Plus className="size-3.5" />
              Add Routine
            </Button>
          </div>
        </div>

        {/* Modal: Add Custom Habit */}
        {isAddingHabit && (
          <form
            onSubmit={handleAddCustomHabit}
            className="p-4 rounded-xl border border-white/10 bg-neutral-900/90 space-y-3 animate-in fade-in duration-200"
          >
            <div className="text-xs font-semibold text-white">Add New Routine Item</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 5km Morning Run, Reading..."
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 col-span-2"
                required
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as HabitItem["category"])}
                className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neutral-300 focus:outline-none"
              >
                <option value="productivity">Productivity</option>
                <option value="health">Health & Fitness</option>
                <option value="trading">Trading / Market</option>
                <option value="meeting">Meetings</option>
                <option value="general">General Life</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingHabit(false)}
                className="text-xs text-neutral-400 h-7"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7">
                Save Habit
              </Button>
            </div>
          </form>
        )}

        {/* Habit List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {todayLog.habits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                habit.completed
                  ? "bg-emerald-950/20 border-emerald-500/30 text-neutral-200"
                  : "bg-neutral-900/40 border-white/5 hover:border-white/10 text-neutral-400"
              }`}
            >
              <div className="flex items-center gap-3">
                {habit.completed ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="size-4 text-neutral-500 shrink-0" />
                )}
                <div>
                  <div
                    className={`text-xs font-medium ${
                      habit.completed ? "text-white line-through opacity-80" : "text-neutral-200"
                    }`}
                  >
                    {habit.title}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 capitalize">
                    <span>{habit.category}</span>
                    {habit.value && <span>• {habit.value}</span>}
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  habit.completed
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-neutral-800 text-neutral-500"
                }`}
              >
                {habit.completed ? "Done" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Update Trading PnL */}
      {isPnlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSavePnl}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 space-y-4 shadow-2xl text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-400" />
                Log Daily Trading PnL
              </h3>
              <button
                type="button"
                onClick={() => setIsPnlModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Realized Dollar Gain / Loss ($)</label>
                <input
                  type="number"
                  step="any"
                  value={pnlInput}
                  onChange={(e) => setPnlInput(e.target.value)}
                  placeholder="e.g. 450 or -120"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Total Executed Trades / Positions</label>
                <input
                  type="number"
                  value={pnlTrades}
                  onChange={(e) => setPnlTrades(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPnlModalOpen(false)}
                className="text-xs text-neutral-400"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                Save & Sync
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Google Meeting */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveMeeting}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 space-y-4 shadow-2xl text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-blue-400" />
                Schedule / Log Google Meeting
              </h3>
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Meeting Name / Topic</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q4 Growth Sync, Product Standup"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Time Window / Slot</label>
                <input
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  placeholder="e.g. 2:30 PM, Tomorrow 10:00 AM"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-xs text-neutral-400"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                Add & Stage Calendar Hold
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
