import React from 'react'
import { Activity, Settings, Bell, User } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">AI-OCR Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings size={20} className="text-slate-600" />
            </button>
            
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <User size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

