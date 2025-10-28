import React, { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'

const mockDeploymentData = {
  clusters: [
    {
      name: 'AKS Primary',
      provider: 'Azure',
      status: 'healthy',
      nodes: 3,
      activeNodes: 3,
      version: '1.28.0',
      lastUpdate: '2 hours ago',
      pods: {
        running: 12,
        pending: 0,
        failed: 0
      },
      services: [
        { name: 'ai-ocr-service', replicas: 3, ready: 3, status: 'Running' },
        { name: 'api-gateway', replicas: 2, ready: 2, status: 'Running' },
        { name: 'monitoring-stack', replicas: 1, ready: 1, status: 'Running' }
      ]
    },
    {
      name: 'GKE Secondary',
      provider: 'Google Cloud',
      status: 'healthy',
      nodes: 4,
      activeNodes: 4,
      version: '1.27.8',
      lastUpdate: '1 hour ago',
      pods: {
        running: 15,
        pending: 1,
        failed: 0
      },
      services: [
        { name: 'ai-ocr-service', replicas: 4, ready: 4, status: 'Running' },
        { name: 'load-balancer', replicas: 2, ready: 2, status: 'Running' },
        { name: 'cache-layer', replicas: 1, ready: 1, status: 'Running' }
      ]
    }
  ],
  recentEvents: [
    { time: '14:32', type: 'deployment', message: 'Successfully deployed v1.2.3 to AKS', status: 'success' },
    { time: '14:15', type: 'scaling', message: 'Auto-scaled GKE cluster from 3 to 4 nodes', status: 'success' },
    { time: '13:48', type: 'alert', message: 'High memory usage detected on Node-1 (AKS)', status: 'warning' },
    { time: '13:20', type: 'deployment', message: 'Rolled back to v1.2.1 due to performance issues', status: 'info' }
  ]
}

function StatusBadge({ status }) {
  const statusConfig = {
    healthy: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
    error: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
  }
  
  const config = statusConfig[status] || statusConfig.healthy
  const Icon = config.icon
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text}`}>
      <Icon size={16} />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  )
}

function EventIcon({ type }) {
  const icons = {
    deployment: <Zap size={16} className="text-blue-600" />,
    scaling: <Zap size={16} className="text-purple-600" />,
    alert: <AlertCircle size={16} className="text-yellow-600" />,
    info: <Clock size={16} className="text-slate-600" />
  }
  return icons[type] || icons.info
}

export default function DeploymentStatus({ cluster }) {
  const [data] = useState(mockDeploymentData)

  return (
    <div className="space-y-6">
      {/* Cluster Overview */}
      {data.clusters.map((clusterData, idx) => (
        <div key={idx} className="card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{clusterData.name}</h3>
              <p className="text-sm text-slate-600">{clusterData.provider} • Kubernetes {clusterData.version}</p>
            </div>
            <StatusBadge status={clusterData.status} />
          </div>

          {/* Cluster Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Nodes</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {clusterData.activeNodes}/{clusterData.nodes}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Running Pods</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{clusterData.pods.running}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Pending</p>
              <p className={`text-2xl font-bold mt-1 ${clusterData.pods.pending > 0 ? 'text-yellow-600' : 'text-slate-900'}`}>
                {clusterData.pods.pending}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Failed</p>
              <p className={`text-2xl font-bold mt-1 ${clusterData.pods.failed > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {clusterData.pods.failed}
              </p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Deployed Services</h4>
            <div className="space-y-2">
              {clusterData.services.map((service, sidx) => (
                <div key={sidx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-600">
                      {service.ready}/{service.replicas} replicas ready
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-900">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">Last updated: {clusterData.lastUpdate}</p>
        </div>
      ))}

      {/* Recent Events */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Deployment Events</h3>
        <div className="space-y-3">
          {data.recentEvents.map((event, idx) => (
            <div key={idx} className="flex gap-4 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                {EventIcon({ type: event.type })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{event.message}</p>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{event.time}</span>
                </div>
                <div className="mt-1">
                  {event.status === 'success' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Success
                    </span>
                  )}
                  {event.status === 'warning' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Warning
                    </span>
                  )}
                  {event.status === 'info' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Info
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Deployment Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Cluster Availability</span>
              <span className="font-semibold text-slate-900">99.9%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pod Success Rate</span>
              <span className="font-semibold text-slate-900">100%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Resource Allocation</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">CPU Allocated</span>
              <span className="font-semibold text-slate-900">68%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Memory Allocated</span>
              <span className="font-semibold text-slate-900">72%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

