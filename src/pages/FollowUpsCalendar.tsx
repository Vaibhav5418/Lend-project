import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '../api/client';
import type { Inquiry } from '../types';

export default function FollowUpsCalendar() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    api.getInquiries().then(setInquiries).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const followUpsWithDates = inquiries.filter(inq => inq.nextFollowUp);

  const getFollowUpsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return followUpsWithDates.filter(inq => inq.nextFollowUp?.startsWith(dateStr));
  };

  if (loading) return <div className="p-6 text-gray-500">Loading calendar...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Follow-ups Calendar</h1>
        <p className="text-gray-600 mt-1">Track and manage all scheduled follow-ups</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="bg-gray-50 px-2 py-3 text-center text-sm font-semibold text-gray-700"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-white h-24"></div>
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const followUps = getFollowUpsForDate(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`bg-white p-2 h-24 overflow-hidden ${
                  isToday ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday
                      ? 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center'
                      : 'text-gray-900'
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {followUps.slice(0, 2).map((followUp) => (
                    <div
                      key={followUp.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                        followUp.priority === 'Hot'
                          ? 'bg-red-100 text-red-700'
                          : followUp.priority === 'Warm'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      title={followUp.name}
                    >
                      {followUp.name}
                    </div>
                  ))}
                  {followUps.length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{followUps.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Follow-ups List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Follow-ups</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {followUpsWithDates.slice(0, 5).map((inquiry) => (
            <div key={inquiry.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{inquiry.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {inquiry.type} • {inquiry.mobile}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{inquiry.nextFollowUp}</p>
                  <p className="text-sm text-gray-500 mt-1">{inquiry.assignedTo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
