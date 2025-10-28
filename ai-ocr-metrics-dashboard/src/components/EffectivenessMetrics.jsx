import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { CheckCircle, AlertTriangle, Target } from 'lucide-react'

const mockEffectivenessData = {
  ocrPrecision: 96.8,
  ocrPrecisionTrend: 2.1,
  answerFaithfulness: 94.2,
  answerFaithfulnessTrend: 1.5,
  answerRelevancy: 97.1,
  answerRelevancyTrend: 0.8,
  contextualPrecision: 92.5,
  contextualPrecisionTrend: -0.3,
  precisionTrend: [
    { time: '00:00', ocr: 95.2, faithfulness: 92.8, relevancy: 96.5, contextual: 92.8 },
    { time: '04:00', ocr: 95.8, faithfulness: 93.2, relevancy: 96.8, contextual: 92.9 },
    { time: '08:00', ocr: 96.1, faithfulness: 93.6, relevancy: 96.9, contextual: 92.6 },
    { time: '12:00', ocr: 96.5, faithfulness: 94.0, relevancy: 97.0, contextual: 92.4 },
    { time: '16:00', ocr: 96.7, faithfulness: 94.1, relevancy: 97.1, contextual: 92.5 },
    { time: '20:00', ocr: 96.9, faithfulness: 94.2, relevancy: 97.1, contextual: 92.6 },
    { time: '23:59', ocr: 96.8, faithfulness: 94.2, relevancy: 97.1, contextual: 92.5 }
  ],
  radarData: [
    { metric: 'OCR Precision', value: 96.8 },
    { metric: 'Faithfulness', value: 94.2 },
    { metric: 'Relevancy', value: 97.1 },
    { metric: 'Contextual', value: 92.5 }
  ],
  errorRates: [
    { model: 'Gemini', cer: 2.1, wer: 3.2 },
    { model: 'GPT-4', cer: 1.8, wer: 2.9 },
    { model: 'Claude', cer: 1.9, wer: 3.0 }
  ]
}

function EffectivenessCard({ icon: Icon, label, value, unit, trend, trendLabel, status }) {
  const isPositive = trend > 0
  const statusColor = status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'
  const statusBg = status === 'good' ? 'bg-green-100' : status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="metric-value">{value}</span>
            <span className="text-sm text-slate-600">{unit}</span>
          </div>
          <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-sm font-medium">{trend > 0 ? '+' : ''}{trend}% {trendLabel}</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${statusBg} rounded-lg flex items-center justify-center`}>
          <Icon className={statusColor} size={24} />
        </div>
      </div>
    </div>
  )
}

export default function EffectivenessMetrics({ cluster, expanded = false }) {
  const [data] = useState(mockEffectivenessData)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EffectivenessCard
          icon={CheckCircle}
          label="OCR Precision"
          value={data.ocrPrecision.toFixed(1)}
          unit="%"
          trend={data.ocrPrecisionTrend}
          trendLabel="improvement"
          status="good"
        />
        <EffectivenessCard
          icon={Target}
          label="Answer Faithfulness"
          value={data.answerFaithfulness.toFixed(1)}
          unit="%"
          trend={data.answerFaithfulnessTrend}
          trendLabel="improvement"
          status="good"
        />
        <EffectivenessCard
          icon={CheckCircle}
          label="Answer Relevancy"
          value={data.answerRelevancy.toFixed(1)}
          unit="%"
          trend={data.answerRelevancyTrend}
          trendLabel="improvement"
          status="good"
        />
        <EffectivenessCard
          icon={AlertTriangle}
          label="Contextual Precision"
          value={data.contextualPrecision.toFixed(1)}
          unit="%"
          trend={data.contextualPrecisionTrend}
          trendLabel="change"
          status="warning"
        />
      </div>

      {expanded && (
        <>
          {/* Precision Metrics Trend */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Effectiveness Metrics Trend</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.precisionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[90, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => value.toFixed(1)}
                />
                <Legend />
                <Line type="monotone" dataKey="ocr" stroke="#3b82f6" strokeWidth={2} name="OCR Precision" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="faithfulness" stroke="#10b981" strokeWidth={2} name="Faithfulness" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="relevancy" stroke="#f59e0b" strokeWidth={2} name="Relevancy" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="contextual" stroke="#ef4444" strokeWidth={2} name="Contextual" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart for Overall Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4">Quality Metrics Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
                  <Radar name="Score (%)" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => value.toFixed(1)}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Error Rates by Model */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4">Error Rates by LLM Model</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.errorRates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="model" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => value.toFixed(2)}
                  />
                  <Legend />
                  <Bar dataKey="cer" fill="#3b82f6" name="Character Error Rate (%)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="wer" fill="#06b6d4" name="Word Error Rate (%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality Assessment Details */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Quality Assessment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">OCR Decoding Precision</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Character Error Rate (CER)</span>
                    <span className="font-semibold text-slate-900">2.1%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '97.9%' }}></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Answer Quality</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Hallucination Rate</span>
                    <span className="font-semibold text-slate-900">5.8%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Relevancy Score</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Relevant Answers</span>
                    <span className="font-semibold text-slate-900">97.1%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '97.1%' }}></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Context Preservation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Critical Info Retained</span>
                    <span className="font-semibold text-slate-900">92.5%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '92.5%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

