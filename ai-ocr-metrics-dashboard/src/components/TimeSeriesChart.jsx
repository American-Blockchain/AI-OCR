import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const mockTimeSeriesData = [
  { time: '00:00', compression: 3.8, latency: 1450, cost: 0.0052, accuracy: 95.2 },
  { time: '04:00', compression: 3.9, latency: 1380, cost: 0.0048, accuracy: 95.8 },
  { time: '08:00', compression: 4.0, latency: 1320, cost: 0.0046, accuracy: 96.1 },
  { time: '12:00', compression: 4.1, latency: 1280, cost: 0.0045, accuracy: 96.5 },
  { time: '16:00', compression: 4.2, latency: 1250, cost: 0.0044, accuracy: 96.7 },
  { time: '20:00', compression: 4.3, latency: 1240, cost: 0.0043, accuracy: 96.9 },
  { time: '23:59', compression: 4.2, latency: 1240, cost: 0.0045, accuracy: 96.8 }
]

export default function TimeSeriesChart({ timeRange, cluster }) {
  const [selectedMetrics, setSelectedMetrics] = useState({
    compression: true,
    latency: true,
    cost: false,
    accuracy: false
  })

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }))
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Key Metrics Timeline</h3>
          <p className="text-sm text-slate-600">24-hour performance overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'compression', label: 'Compression', color: '#3b82f6' },
            { key: 'latency', label: 'Latency', color: '#ef4444' },
            { key: 'cost', label: 'Cost', color: '#10b981' },
            { key: 'accuracy', label: 'Accuracy', color: '#f59e0b' }
          ].map(metric => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedMetrics[metric.key]
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: metric.color }}></span>
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mockTimeSeriesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis yAxisId="left" stroke="#94a3b8" />
          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
            formatter={(value, name) => {
              if (name === 'compression') return [value.toFixed(2), 'Compression Ratio']
              if (name === 'latency') return [value + 'ms', 'Latency']
              if (name === 'cost') return ['$' + value.toFixed(4), 'Cost']
              if (name === 'accuracy') return [value.toFixed(1) + '%', 'Accuracy']
              return [value, name]
            }}
          />
          <Legend />
          
          {selectedMetrics.compression && (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="compression" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Compression Ratio"
            />
          )}
          
          {selectedMetrics.latency && (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="latency" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              name="Latency (ms)"
            />
          )}
          
          {selectedMetrics.cost && (
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="cost" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Cost (USD)"
            />
          )}
          
          {selectedMetrics.accuracy && (
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="accuracy" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
              name="Accuracy (%)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          <strong>Tip:</strong> Click the metric buttons above to show/hide specific metrics. Use this to compare trends across different KPIs.
        </p>
      </div>
    </div>
  )
}

