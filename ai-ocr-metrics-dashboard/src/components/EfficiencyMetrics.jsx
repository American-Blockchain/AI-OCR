import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Zap, Clock } from 'lucide-react'

const mockEfficiencyData = {
  tokenCompressionRatio: 4.2,
  tokenCompressionTrend: 5.3,
  latencyMs: 1240,
  latencyTrend: -8.2,
  costPerDoc: 0.0045,
  costTrend: -12.5,
  compressionHistory: [
    { time: '00:00', ratio: 3.8 },
    { time: '04:00', ratio: 3.9 },
    { time: '08:00', ratio: 4.0 },
    { time: '12:00', ratio: 4.1 },
    { time: '16:00', ratio: 4.2 },
    { time: '20:00', ratio: 4.3 },
    { time: '23:59', ratio: 4.2 }
  ],
  latencyBreakdown: [
    { name: 'OCR Processing', value: 720, color: '#3b82f6' },
    { name: 'LLM Processing', value: 520, color: '#06b6d4' }
  ],
  costBreakdown: [
    { name: 'Gemini API', value: 0.0025, color: '#10b981' },
    { name: 'GPT API', value: 0.0020, color: '#f59e0b' }
  ]
}

function MetricCard({ icon: Icon, label, value, unit, trend, trendLabel }) {
  const isPositive = trend > 0
  const trendColor = isPositive ? 'text-red-600' : 'text-green-600'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

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
            <TrendIcon size={16} />
            <span className="text-sm font-medium">{Math.abs(trend)}% {trendLabel}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="text-blue-600" size={24} />
        </div>
      </div>
    </div>
  )
}

export default function EfficiencyMetrics({ cluster, expanded = false }) {
  const [data] = useState(mockEfficiencyData)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={Zap}
          label="Token Compression Ratio"
          value={data.tokenCompressionRatio.toFixed(1)}
          unit="x"
          trend={data.tokenCompressionTrend}
          trendLabel="improvement"
        />
        <MetricCard
          icon={Clock}
          label="End-to-End Latency"
          value={data.latencyMs}
          unit="ms"
          trend={data.latencyTrend}
          trendLabel="faster"
        />
        <MetricCard
          icon={DollarSign}
          label="Cost per Document"
          value={`$${data.costPerDoc.toFixed(4)}`}
          unit="USD"
          trend={data.costTrend}
          trendLabel="cheaper"
        />
      </div>

      {expanded && (
        <>
          {/* Token Compression Ratio Trend */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Token Compression Ratio Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.compressionHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => value.toFixed(2)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ratio" 
                  stroke="#3b82f6" 
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                  name="Compression Ratio"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Latency Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4">Latency Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.latencyBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}ms`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.latencyBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}ms`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.latencyBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}ms</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4">Cost Breakdown by LLM</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.costBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => `$${value.toFixed(4)}`}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.costBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">${item.value.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

