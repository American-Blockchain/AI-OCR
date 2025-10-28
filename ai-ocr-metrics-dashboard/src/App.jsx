import React, { useState, useEffect } from 'react'
import { BarChart, LineChart, PieChart, TrendingUp, AlertCircle, ClipboardList } from 'lucide-react'
import Navbar from './components/Navbar'
import EfficiencyMetrics from './components/EfficiencyMetrics'
import EffectivenessMetrics from './components/EffectivenessMetrics'
import ResourceMetrics from './components/ResourceMetrics'
import DeploymentStatus from './components/DeploymentStatus'
import TimeSeriesChart from './components/TimeSeriesChart'
import BenchmarkComparison from './components/BenchmarkComparison'
import './styles/index.css'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedCluster, setSelectedCluster] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate data fetching
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [timeRange, selectedCluster])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI-OCR Metrics Dashboard</h1>
              <p className="text-slate-600 mt-1">Real-time KPI monitoring and performance analytics</p>
            </div>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 hover:border-slate-400"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 hover:border-slate-400"
              >
                <option value="all">All Clusters</option>
                <option value="aks">AKS Cluster</option>
                <option value="gke">GKE Cluster</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart },
              { id: 'efficiency', label: 'Efficiency', icon: TrendingUp },
              { id: 'effectiveness', label: 'Effectiveness', icon: LineChart },
              { id: 'benchmark', label: 'Benchmark', icon: ClipboardList },
              { id: 'resources', label: 'Resources', icon: AlertCircle },
              { id: 'deployment', label: 'Deployment', icon: PieChart }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <TimeSeriesChart timeRange={timeRange} cluster={selectedCluster} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EfficiencyMetrics cluster={selectedCluster} />
                  <EffectivenessMetrics cluster={selectedCluster} />
                </div>
              </div>
            )}
            
            {activeTab === 'efficiency' && (
              <EfficiencyMetrics cluster={selectedCluster} expanded={true} />
            )}
            
            {activeTab === 'effectiveness' && (
              <EffectivenessMetrics cluster={selectedCluster} expanded={true} />
            )}

            {activeTab === 'benchmark' && (
              <BenchmarkComparison />
            )}
            
            {activeTab === 'resources' && (
              <ResourceMetrics cluster={selectedCluster} />
            )}
            
            {activeTab === 'deployment' && (
              <DeploymentStatus cluster={selectedCluster} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App

