import React, { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Cpu, HardDrive, AlertTriangle } from 'lucide-react'

const mockResourceData = {
  gpuVramUsage: 78.5,
  gpuVramTrend: 3.2,
  cpuUsage: 62.1,
  cpuTrend: -2.1,
  memoryUsage: 71.3,
  memoryTrend: 1.5,
  vramHistory: [
    { time: '00:00', vram: 65.2, cpu: 58.3, memory: 68.5 },
    { time: '04:00', vram: 68.5, cpu: 60.2, memory: 69.1 },
    { time: '08:00', vram: 72.1, cpu: 61.5, memory: 70.2 },
    { time: '12:00', vram: 75.3, cpu: 62.8, memory: 71.0 },
    { time: '16:00', vram: 77.2, cpu: 62.5, memory: 71.5 },
    { time: '20:00', vram: 78.8, cpu: 62.2, memory: 71.2 },
    { time: '23:59', vram: 78.5, cpu: 62.1, memory: 71.3 }
  ],
  bottlenecks: [
    { component: 'SAM (Segment Anything)', time: 320, percentage: 35.2 },
    { component: 'DeepEncoder', time: 280, percentage: 30.8 },
    { component: 'CLIP Component', time: 240, percentage: 26.4 },
    { component: 'Compression', time: 70, percentage: 7.6 }
  ],
  nodeResources: [
    { node: 'Node-1 (AKS)', gpu: 82, cpu: 65, memory: 74 },
    { node: 'Node-2 (AKS)', gpu: 75, cpu: 58, memory: 68 },
    { node: 'Node-1 (GKE)', gpu: 79, cpu: 64, memory: 72 },
    { node: 'Node-2 (GKE)', gpu: 77, cpu: 61, memory: 70 }
  ]
}

function ResourceCard({ icon: Icon, label, value, unit, trend, warning = false }) {
  const isPositive = trend > 0
  const trendColor = isPositive ? 'text-red-600' : 'text-green-600'
  const bgColor = warning ? 'bg-red-100' : 'bg-blue-100'
  const iconColor = warning ? 'text-red-600' : 'text-blue-600'

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="metric-value">{value}</span>
            <span className="text-sm text-slate-600">{unit}</span>
          </div>
          <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
            <span className="text-sm font-medium">{trend > 0 ? '+' : ''}{trend}% {trend > 0 ? 'increase' : 'decrease'}</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={iconColor} size={24} />
        </div>
      </div>
      {warning && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">High resource utilization detected</p>
        </div>
      )}
    </div>
  )
}

export default function ResourceMetrics({ cluster }) {
  const [data] = useState(mockResourceData)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResourceCard
          icon={HardDrive}
          label="GPU VRAM Usage"
          value={data.gpuVramUsage.toFixed(1)}
          unit="%"
          trend={data.gpuVramTrend}
          warning={data.gpuVramUsage > 75}
        />
        <ResourceCard
          icon={Cpu}
          label="CPU Usage"
          value={data.cpuUsage.toFixed(1)}
          unit="%"
          trend={data.cpuTrend}
          warning={false}
        />
        <ResourceCard
          icon={HardDrive}
          label="Memory Usage"
          value={data.memoryUsage.toFixed(1)}
          unit="%"
          trend={data.memoryTrend}
          warning={data.memoryUsage > 70}
        />
      </div>

      {/* Resource Usage Trend */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">Resource Utilization Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data.vramHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => value.toFixed(1)}
            />
            <Legend />
            <Line type="monotone" dataKey="vram" stroke="#ef4444" strokeWidth={2} name="GPU VRAM (%)" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU (%)" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={2} name="Memory (%)" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Compute Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Compute Bottlenecks Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bottlenecks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="component" type="category" stroke="#94a3b8" width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => value.toFixed(1)}
              />
              <Bar dataKey="time" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.bottlenecks.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.component}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{item.percentage.toFixed(1)}%</span>
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node-level Resources */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Node Resource Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.nodeResources}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="node" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="gpu" fill="#ef4444" name="GPU (%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cpu" fill="#3b82f6" name="CPU (%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="memory" fill="#f59e0b" name="Memory (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-slate-900 mb-3">Resource Optimization Recommendations</h3>
        <ul className="space-y-2">
          <li className="flex gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span className="text-sm text-slate-700">GPU VRAM is at 78.5% - Consider increasing batch size or implementing memory optimization techniques</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span className="text-sm text-slate-700">SAM component accounts for 35.2% of processing time - Profile and optimize the Segment Anything Model</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 font-bold">•</span>
            <span className="text-sm text-slate-700">Node-1 (AKS) shows highest GPU utilization (82%) - Consider load balancing across nodes</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

