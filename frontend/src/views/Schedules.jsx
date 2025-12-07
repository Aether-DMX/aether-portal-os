import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Play, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import useScheduleStore from '../store/scheduleStore';

export default function Schedules() {
  const navigate = useNavigate();
  const { schedules, fetchSchedules, deleteSchedule, toggleSchedule } = useScheduleStore();

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 theme-text" /> Schedules
          </h1>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {(!schedules || schedules.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Calendar className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-white/40 mb-4">No schedules created yet</p>
              <button className="btn btn-primary">Create Your First Schedule</button>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div key={schedule.schedule_id || schedule.id} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${schedule.enabled ? 'bg-green-500/20' : 'bg-white/5'}`}>
                      <Clock className={`w-5 h-5 ${schedule.enabled ? 'text-green-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{schedule.name}</h3>
                      <p className="text-xs text-white/50">{schedule.cron || schedule.time} • {schedule.action}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSchedule?.(schedule.schedule_id || schedule.id)}
                      className={`btn btn-sm ${schedule.enabled ? 'btn-success' : 'btn-secondary'}`}
                    >
                      {schedule.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteSchedule?.(schedule.schedule_id || schedule.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const SchedulesHeaderExtension = () => null;
