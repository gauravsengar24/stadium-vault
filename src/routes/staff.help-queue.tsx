import { createFileRoute } from '@tanstack/react-router'
import { LifeBuoy, MessageCircle, CheckCircle, Clock, User } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/staff/help-queue')({
  component: StaffHelpQueue,
})

interface HelpRequest {
  id: string
  guest: string
  zone: string
  issue: string
  status: 'waiting' | 'active' | 'resolved'
  time: Date
  language: string
}

const initialRequests: HelpRequest[] = [
  { id: 'HR-001', guest: 'Guest #1024', zone: 'A', issue: 'Lost child at section A', status: 'active', time: new Date(Date.now() - 300000), language: 'English' },
  { id: 'HR-002', guest: 'Guest #1031', zone: 'C', issue: 'Need wheelchair assistance', status: 'waiting', time: new Date(Date.now() - 600000), language: 'English' },
  { id: 'HR-003', guest: 'Guest #1042', zone: 'E', issue: 'Food allergy question', status: 'waiting', time: new Date(Date.now() - 900000), language: 'Español' },
  { id: 'HR-004', guest: 'Guest #1055', zone: 'B', issue: 'Report suspicious package', status: 'active', time: new Date(Date.now() - 1200000), language: 'English' },
  { id: 'HR-005', guest: 'Guest #1067', zone: 'G', issue: 'Medical assistance needed', status: 'resolved', time: new Date(Date.now() - 1800000), language: 'Français' },
]

function StaffHelpQueue() {
  const [requests, setRequests] = useState(initialRequests)

  const counts = {
    waiting: requests.filter(r => r.status === 'waiting').length,
    active: requests.filter(r => r.status === 'active').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
  }

  function updateStatus(id: string, status: HelpRequest['status']) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <LifeBuoy className="size-5 text-[#58d68d]" />
          <h1 className="text-2xl font-bold text-white">Help Queue</h1>
        </div>
        <p className="text-[#8a94a8] text-sm">Guest assistance requests</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 fade-in-up stagger-1">
        {[
          { label: 'Waiting', value: counts.waiting, color: '#f59e0b' },
          { label: 'Active', value: counts.active, color: '#3b82f6' },
          { label: 'Resolved', value: counts.resolved, color: '#58d68d' },
        ].map(s => (
          <div key={s.label} className="glass p-3 text-center rounded-2xl">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-[#6b7a99]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3 fade-in-up stagger-2">
        {requests.map(req => (
          <div key={req.id} className={`glass p-4 rounded-2xl ${
            req.status === 'resolved' ? 'opacity-50' : ''
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="size-4 text-[#8a94a8]" />
                  <span className="text-sm font-medium text-white">{req.guest}</span>
                  <span className="text-[10px] text-[#6b7a99]">{req.id}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    req.status === 'waiting' ? 'bg-amber-500/20 text-amber-400' :
                    req.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>{req.status}</span>
                </div>
                <p className="text-xs text-[#d1d9e6] mb-1">{req.issue}</p>
                <div className="flex items-center gap-3 text-[10px] text-[#5a6a8a]">
                  <span>Zone {req.zone}</span>
                  <span>{req.language}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {Math.round((Date.now() - req.time.getTime()) / 60000)}min ago
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {req.status === 'waiting' && (
                  <button onClick={() => updateStatus(req.id, 'active')} className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                    <MessageCircle className="size-3.5" />
                  </button>
                )}
                {req.status !== 'resolved' && (
                  <button onClick={() => updateStatus(req.id, 'resolved')} className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                    <CheckCircle className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
