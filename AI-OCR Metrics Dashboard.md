# AI-OCR Metrics Dashboard

A comprehensive real-time metrics dashboard for monitoring and visualizing AI-OCR system performance across efficiency, effectiveness, and resource consumption dimensions.

## Overview

This dashboard provides unified KPI visualization based on the measurement framework outlined in the AI-OCR project documentation. It tracks three critical measurement categories:

### 1. **Efficiency Metrics** (Cost, Speed, Compression)

Measures how much better the AI-OCR compression method performs compared to baseline approaches.

| Metric | Description | Tools |
|--------|-------------|-------|
| **Token Compression Ratio** | Primary metric showing compression effectiveness (Input Tokens / Compressed Tokens) | tiktoken, google.generativeai.count_tokens, DeepSeek-OCR Benchmarks |
| **End-to-End Latency** | Total pipeline time from document input to final LLM answer (T_ocr + T_llm) | Langfuse, LangSmith |
| **Total Cost per Document** | Business-critical metric tracking all API and infrastructure costs | Langfuse, LangSmith, Binadox, TrueFoundry |

### 2. **Effectiveness Metrics** (Accuracy & Faithfulness)

Ensures that compression doesn't lose critical information needed for accurate answers.

| Metric | Description | Tools |
|--------|-------------|-------|
| **OCR Decoding Precision** | Character Error Rate (CER) and Word Error Rate (WER) against ground truth | jiwer, Standard OCR benchmarks (Fox, OmniDocBench) |
| **Answer Faithfulness** | Verifies LLM doesn't hallucinate or invent information lost during compression | Ragas, LangSmith LLM-as-a-judge |
| **Answer Relevancy** | Confirms LLM answer is relevant to user's question despite compression | Ragas answer_relevancy metric |
| **Contextual Precision** | Validates that compression preserved the most important document parts | Ragas context_precision metric |

### 3. **Resource Consumption** (For Self-Hosted OCR)

Monitors hardware requirements and identifies performance bottlenecks.

| Metric | Description | Tools |
|--------|-------------|-------|
| **GPU VRAM Usage** | Memory required to run DeepSeek-OCR DeepEncoder model | nvidia-smi, GPUtil, nvidia-ml-py |
| **Compute Bottlenecks** | Identifies slowest components (SAM, DeepEncoder, CLIP, Compressor) | PyTorch Profiler |

## Architecture

The dashboard is built with modern open-source frameworks optimized for KPI visualization:

- **Frontend**: React 18 + Recharts for interactive visualizations
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for consistent UI components
- **Charts**: Recharts for real-time data visualization
- **Backend**: Express.js (optional for data aggregation)
- **Database**: SQLite with Drizzle ORM (optional for historical data)

## Features

### Dashboard Tabs

1. **Overview** - High-level KPI summary with key metrics and trends
2. **Efficiency** - Detailed token compression, latency, and cost analysis
3. **Effectiveness** - OCR precision, answer quality, and relevancy metrics
4. **Resources** - GPU/CPU utilization and compute bottleneck analysis
5. **Deployment** - AKS and GKE cluster status and health monitoring

### Key Visualizations

- **Line Charts**: Trend analysis for compression ratio, latency, and accuracy
- **Bar Charts**: Cost breakdown by LLM model and latency breakdown by component
- **Pie Charts**: Resource allocation and cost distribution
- **Radar Charts**: Multi-dimensional quality assessment
- **Progress Bars**: Real-time resource utilization tracking
- **Status Cards**: Cluster health and deployment status

### Time Range Filtering

- Last 1 Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days

### Cluster Selection

- All Clusters (aggregated view)
- AKS Cluster (Azure-specific metrics)
- GKE Cluster (Google Cloud-specific metrics)

## Installation

### Prerequisites

- Node.js 18+ and npm/pnpm
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/American-Blockchain/AI-OCR.git
cd ai-ocr-metrics-dashboard

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The dashboard will be available at `http://localhost:5173`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000/api
VITE_REFRESH_INTERVAL=30000
```

### Customizing Mock Data

Edit the mock data objects in each component to connect to real data sources:

- `src/components/EfficiencyMetrics.jsx` - `mockEfficiencyData`
- `src/components/EffectivenessMetrics.jsx` - `mockEffectivenessData`
- `src/components/ResourceMetrics.jsx` - `mockResourceData`
- `src/components/DeploymentStatus.jsx` - `mockDeploymentData`

## Integration with Real Data Sources

### Recommended Data Pipeline

1. **Local Development (Quality Measurement)**
   - Use **Langfuse** for tracing and logging
   - Use **Ragas** for quality evaluation
   - Create a "golden dataset" of 50 documents with 5 Q&A pairs each
   - Run all questions through pipeline and log to Langfuse

2. **Production (Cost & Governance)**
   - Route all API calls through **TrueFoundry** AI Gateway
   - Use **Binadox** dashboard for high-level token consumption and cost tracking
   - Set budget alerts to monitor efficiency gains

3. **Resource Monitoring**
   - Use **Prometheus** + **Grafana** for GPU/CPU metrics
   - Integrate with Kubernetes metrics API for cluster health

### API Integration Example

```javascript
// In your component
const fetchMetrics = async () => {
  const response = await fetch('/api/metrics', {
    params: { timeRange, cluster }
  })
  const data = await response.json()
  setMetrics(data)
}
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t ai-ocr-dashboard:latest .

# Run container
docker run -p 5173:5173 ai-ocr-dashboard:latest
```

### Kubernetes

```bash
# Deploy to AKS/GKE
kubectl apply -f k8s/dashboard-deployment.yaml
```

### GitHub Pages / Vercel

```bash
# Build static site
pnpm build

# Deploy dist/ folder to your hosting service
```

## KPI Benchmarks

Based on the measurement framework, here are typical benchmark values:

| Metric | Target | Good | Warning |
|--------|--------|------|---------|
| Token Compression Ratio | 4.0x | > 3.8x | < 3.5x |
| End-to-End Latency | < 1.5s | < 1.2s | > 2.0s |
| Cost per Document | < $0.005 | < $0.004 | > $0.01 |
| OCR Precision (WER) | < 3% | < 2% | > 5% |
| Answer Faithfulness | > 94% | > 96% | < 90% |
| Answer Relevancy | > 96% | > 97% | < 94% |
| Contextual Precision | > 92% | > 94% | < 90% |
| GPU VRAM Usage | < 80% | < 70% | > 85% |

## Troubleshooting

### Dashboard not loading metrics

1. Check that the backend API is running
2. Verify CORS is configured correctly
3. Check browser console for API errors

### Charts not rendering

1. Ensure Recharts is properly installed
2. Check that mock data is in the correct format
3. Verify browser supports ES modules

### Performance issues

1. Reduce time range to load fewer data points
2. Implement data pagination for large datasets
3. Use React.memo() for expensive components

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch
2. Make your changes
3. Submit a pull request with a clear description

## License

MIT License - See LICENSE file for details

## References

- [DeepSeek-OCR Paper](https://arxiv.org/abs/2406.06495)
- [Ragas Framework](https://docs.ragas.io/)
- [Langfuse Documentation](https://langfuse.com/docs)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

