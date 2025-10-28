import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'

const mockBenchmarkData = {
  efficiency: [
    { metric: 'Compression Ratio', deepseek: 4.2, lighton: 1.0, unit: 'x' },
    { metric: 'Latency', deepseek: 1240, lighton: 2850, unit: 'ms' },
    { metric: 'Cost per Doc', deepseek: 0.0043, lighton: 0.0108, unit: '$' },
    { metric: 'Tokens Used', deepseek: 450, lighton: 1800, unit: 'tokens' }
  ],
  
  effectiveness: [
    { metric: 'Faithfulness', deepseek: 94.2, lighton: 95.1, unit: '%' },
    { metric: 'Relevancy', deepseek: 97.1, lighton: 96.8, unit: '%' },
    { metric: 'Context Precision', deepseek: 92.5, lighton: 93.2, unit: '%' },
    { metric: 'Context Recall', deepseek: 91.3, lighton: 94.5, unit: '%' }
  ],
  
  costBreakdown: [
    { name: 'OCR', deepseek: 0.0008, lighton: 0.0012 },
    { name: 'Processing', deepseek: 0.0015, lighton: 0.0035 },
    { name: 'LLM', deepseek: 0.0020, lighton: 0.0061 }
  ],
  
  latencyBreakdown: [
    { name: 'OCR', deepseek: 720, lighton: 850 },
    { name: 'Processing', deepseek: 120, lighton: 450 },
    { name: 'LLM', deepseek: 400, lighton: 1550 }
  ],
  
  qualityRadar: [
    { category: 'Faithfulness', deepseek: 94.2, lighton: 95.1 },
    { category: 'Relevancy', deepseek: 97.1, lighton: 96.8 },
    { category: 'Precision', deepseek: 92.5, lighton: 93.2 },
    { category: 'Recall', deepseek: 91.3, lighton: 94.5 },
    { category: 'Overall', deepseek: 93.8, lighton: 94.9 }
  ],
  
  summary: {
    compression_improvement: '320%',
    latency_improvement: '57%',
    cost_savings: '60%',
    quality_parity: 'Maintained',
    documents_tested: 50,
    total_savings: '$2,450'
  }
}

const COLORS = {
  deepseek: '#3b82f6',
  lighton: '#ef4444',
  neutral: '#94a3b8'
}

function ComparisonCard({ title, value, unit, icon: Icon, trend, trendValue }) {
  const isPositive = trend === 'up'
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{unit}</p>
        </div>
        <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-blue-100'}`}>
          {Icon && <Icon size={24} className={isPositive ? 'text-green-600' : 'text-blue-600'} />}
        </div>
      </div>
      {trendValue && (
        <div className={`flex items-center gap-1 mt-4 ${trendColor}`}>
          <TrendIcon size={16} />
          <span className="text-sm font-medium">{trendValue}</span>
        </div>
      )}
    </div>
  )
}

function EfficiencyComparison() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonCard
          title="Compression Improvement"
          value={mockBenchmarkData.summary.compression_improvement}
          unit="vs LightOn"
          trend="up"
          trendValue="4.2x vs 1.0x"
        />
        <ComparisonCard
          title="Latency Improvement"
          value={mockBenchmarkData.summary.latency_improvement}
          unit="faster"
          trend="up"
          trendValue="1.24s vs 2.85s"
        />
        <ComparisonCard
          title="Cost Savings"
          value={mockBenchmarkData.summary.cost_savings}
          unit="per document"
          trend="up"
          trendValue={mockBenchmarkData.summary.total_savings}
        />
        <ComparisonCard
          title="Quality Parity"
          value={mockBenchmarkData.summary.quality_parity}
          unit="maintained"
          icon={CheckCircle}
          trend="up"
          trendValue="93.8% vs 94.9%"
        />
      </div>

      {/* Efficiency Metrics Comparison */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Efficiency Metrics Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockBenchmarkData.efficiency}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="metric" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value, name) => {
                const metric = name === 'deepseek' ? 'DeepSeek' : 'LightOn'
                return [value, metric]
              }}
            />
            <Legend />
            <Bar dataKey="deepseek" fill={COLORS.deepseek} name="DeepSeek-OCR" />
            <Bar dataKey="lighton" fill={COLORS.lighton} name="LightOn-OCR" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockBenchmarkData.costBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => `$${value.toFixed(4)}`}
              />
              <Legend />
              <Bar dataKey="deepseek" fill={COLORS.deepseek} name="DeepSeek" />
              <Bar dataKey="lighton" fill={COLORS.lighton} name="LightOn" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Latency Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockBenchmarkData.latencyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => `${value}ms`}
              />
              <Legend />
              <Bar dataKey="deepseek" fill={COLORS.deepseek} name="DeepSeek" />
              <Bar dataKey="lighton" fill={COLORS.lighton} name="LightOn" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function EffectivenessComparison() {
  return (
    <div className="space-y-6">
      {/* Quality Metrics Comparison */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quality Metrics Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockBenchmarkData.effectiveness}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="metric" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => `${value.toFixed(1)}%`}
            />
            <Legend />
            <Bar dataKey="deepseek" fill={COLORS.deepseek} name="DeepSeek-OCR" />
            <Bar dataKey="lighton" fill={COLORS.lighton} name="LightOn-OCR" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Radar Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Multi-Dimensional Quality Assessment</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={mockBenchmarkData.qualityRadar}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
            <Radar name="DeepSeek-OCR" dataKey="deepseek" stroke={COLORS.deepseek} fill={COLORS.deepseek} fillOpacity={0.5} />
            <Radar name="LightOn-OCR" dataKey="lighton" stroke={COLORS.lighton} fill={COLORS.lighton} fillOpacity={0.5} />
            <Legend />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => `${value.toFixed(1)}%`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">DeepSeek-OCR Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Compression Efficiency</p>
                <p className="text-sm text-slate-600">4.2x token reduction with minimal quality loss</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Cost Effective</p>
                <p className="text-sm text-slate-600">60% lower API costs compared to traditional RAG</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Context Recall</p>
                <p className="text-sm text-slate-600">Slightly lower recall (91.3% vs 94.5%) due to compression</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">LightOn-OCR Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Higher Recall</p>
                <p className="text-sm text-slate-600">94.5% context recall ensures comprehensive coverage</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Proven Approach</p>
                <p className="text-sm text-slate-600">Traditional RAG with established best practices</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-slate-900">Higher Costs</p>
                <p className="text-sm text-slate-600">60% higher API costs and 2.3x slower latency</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComparisonSummary() {
  return (
    <div className="space-y-6">
      {/* Key Findings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Findings</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900 mb-1">Efficiency Winner: DeepSeek-OCR</p>
            <p className="text-sm text-blue-800">
              DeepSeek-OCR achieves 4.2x token compression with 57% latency improvement and 60% cost savings, 
              making it the clear winner for efficiency-focused applications.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="font-medium text-amber-900 mb-1">Quality Trade-off: Acceptable</p>
            <p className="text-sm text-amber-800">
              While DeepSeek-OCR has slightly lower context recall (91.3% vs 94.5%), overall quality parity 
              is maintained with 93.8% vs 94.9% overall score. The efficiency gains justify this minor trade-off.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="font-medium text-green-900 mb-1">Recommendation: DeepSeek-OCR</p>
            <p className="text-sm text-green-800">
              For production deployments prioritizing cost and speed, DeepSeek-OCR is recommended. 
              For applications requiring maximum recall, LightOn-OCR remains a viable option.
            </p>
          </div>
        </div>
      </div>

      {/* Benchmark Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Benchmark Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{mockBenchmarkData.summary.documents_tested}</p>
            <p className="text-xs text-slate-600 mt-1">Documents Tested</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">250</p>
            <p className="text-xs text-slate-600 mt-1">Q&A Pairs Evaluated</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">4</p>
            <p className="text-xs text-slate-600 mt-1">Ragas Metrics</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{mockBenchmarkData.summary.total_savings}</p>
            <p className="text-xs text-slate-600 mt-1">Total Savings</p>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Detailed Metrics Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900">DeepSeek-OCR</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900">LightOn-OCR</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-900">Compression Ratio</td>
                <td className="text-right py-3 px-4 text-slate-900 font-medium">4.2x</td>
                <td className="text-right py-3 px-4 text-slate-900">1.0x</td>
                <td className="text-right py-3 px-4 text-green-600 font-medium">+320%</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-900">Latency</td>
                <td className="text-right py-3 px-4 text-slate-900 font-medium">1,240ms</td>
                <td className="text-right py-3 px-4 text-slate-900">2,850ms</td>
                <td className="text-right py-3 px-4 text-green-600 font-medium">-57%</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-900">Cost per Document</td>
                <td className="text-right py-3 px-4 text-slate-900 font-medium">$0.0043</td>
                <td className="text-right py-3 px-4 text-slate-900">$0.0108</td>
                <td className="text-right py-3 px-4 text-green-600 font-medium">-60%</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-900">Faithfulness</td>
                <td className="text-right py-3 px-4 text-slate-900 font-medium">94.2%</td>
                <td className="text-right py-3 px-4 text-slate-900">95.1%</td>
                <td className="text-right py-3 px-4 text-yellow-600 font-medium">-0.9%</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-900">Relevancy</td>
                <td className="text-right py-3 px-4 text-slate-900 font-medium">97.1%</td>
                <td className="text-right py-3 px-4 text-slate-900">96.8%</td>
                <td className="text-right py-3 px-4 text-green-600 font-medium">+0.3%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-900">Overall Quality Score</td>
                <td className="text-right py-3 px-4 text-slate-900 font-medium">93.8%</td>
                <td className="text-right py-3 px-4 text-slate-900">94.9%</td>
                <td className="text-right py-3 px-4 text-yellow-600 font-medium">-1.1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function BenchmarkComparison() {
  const [activeTab, setActiveTab] = useState('efficiency')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'efficiency', label: 'Efficiency' },
          { id: 'effectiveness', label: 'Effectiveness' },
          { id: 'summary', label: 'Summary' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'efficiency' && <EfficiencyComparison />}
      {activeTab === 'effectiveness' && <EffectivenessComparison />}
      {activeTab === 'summary' && <ComparisonSummary />}
    </div>
  )
}

