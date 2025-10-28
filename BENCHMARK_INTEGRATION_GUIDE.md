# AI-OCR Benchmark Integration Guide

## Overview

This guide provides step-by-step instructions for integrating and running the LightOnOCR benchmark system within the AI-OCR project. The benchmark enables comparative analysis of DeepSeek-OCR vs traditional RAG approaches.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/American-Blockchain/AI-OCR.git
cd AI-OCR

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-benchmark.txt
```

### Running Your First Benchmark

```bash
# Process a single document
python -m src.benchmark_orchestrator \
  --image path/to/document.jpg \
  --queries "What is the main topic?" "When was it published?"

# Run batch benchmark
python -m src.benchmark_orchestrator \
  --dataset benchmark_data/golden_dataset \
  --output results/ \
  --format json,csv

# View results
cat results/benchmark_results_*.json
```

## Architecture

### Module Organization

```
src/
├── deepseek_ocr_pipeline.py      # Compression-based pipeline
├── lighton_ocr_pipeline.py       # Traditional RAG pipeline
├── benchmark_orchestrator.py     # Benchmark coordinator
├── ragas_evaluator.py            # Quality evaluation
└── benchmark_utils.py            # Utility functions

benchmark_data/
├── golden_dataset/               # 50 test documents
├── qa_pairs.json                 # Q&A pairs for evaluation
└── ground_truth.json             # Ground truth answers

results/
├── benchmark_results_*.json      # Raw results
├── benchmark_metrics_*.csv       # Aggregated metrics
└── benchmark_report.md           # Generated report
```

### Pipeline Components

#### DeepSeek-OCR Pipeline

The compression-based pipeline optimizes for efficiency:

```python
from src.deepseek_ocr_pipeline import DeepSeekCompressionPipeline

# Initialize
pipeline = DeepSeekCompressionPipeline(
    compression_ratio=4.0,
    llm_provider="gemini",
    llm_model="gemini-pro"
)

# Process document
result = pipeline.process_document("document.jpg")
print(f"Compression ratio: {result.ocr_result.compression_ratio:.2f}x")
print(f"Total tokens: {result.total_tokens}")
print(f"Processing time: {result.total_time_ms:.1f}ms")

# Answer query
llm_result = pipeline.answer_query(
    result.compression_result.compressed_representation,
    "What is the main topic?"
)
print(f"Answer: {llm_result.answer}")
print(f"Cost: ${llm_result.cost_usd:.6f}")
```

#### LightOnOCR Pipeline

The traditional RAG pipeline prioritizes recall:

```python
from src.lighton_ocr_pipeline import LightOnRAGPipeline

# Initialize
pipeline = LightOnRAGPipeline(
    ocr_model="lightonai/LightOnOCR-1B-1025",
    embedding_model="all-MiniLM-L6-v2",
    chunk_size=512,
    chunk_overlap=100
)

# Process document
result = pipeline.process_document("document.jpg")
print(f"Extracted text: {len(result.ocr_result.text)} characters")
print(f"Chunks created: {result.chunk_result.chunk_count}")
print(f"Total tokens: {result.total_tokens}")

# Query the database
chunks, scores = pipeline.query("What is the main topic?", top_k=5)
for chunk, score in zip(chunks, scores):
    print(f"Score: {score:.4f} - {chunk[:100]}...")
```

#### Benchmark Orchestrator

The orchestrator manages both pipelines and collects metrics:

```python
from src.benchmark_orchestrator import BenchmarkOrchestrator

# Initialize
orchestrator = BenchmarkOrchestrator(
    output_dir="./results",
    deepseek_config={"compression_ratio": 4.0},
    lighton_config={"chunk_size": 512}
)

# Run single benchmark
result = orchestrator.run_benchmark(
    "document.jpg",
    queries=["What is the main topic?", "When was it published?"]
)

# Run batch benchmark
image_paths = ["doc1.jpg", "doc2.jpg", "doc3.jpg"]
results = orchestrator.run_batch_benchmark(image_paths)

# Save and report
orchestrator.save_results(format="json")
orchestrator.save_results(format="csv")
orchestrator.print_summary()
```

#### Ragas Evaluator

The evaluator assesses answer quality:

```python
from src.ragas_evaluator import RagasEvaluator

# Initialize
evaluator = RagasEvaluator()

# Evaluate single answer
result = evaluator.evaluate_answer(
    question="What is the main topic?",
    answer="The main topic is document analysis.",
    context="This document discusses document analysis and processing.",
    ground_truth="Document analysis is the main topic.",
    pipeline_name="DeepSeek-OCR"
)

print(f"Faithfulness: {result.metrics.faithfulness:.4f}")
print(f"Relevancy: {result.metrics.answer_relevancy:.4f}")
print(f"Overall Score: {result.metrics.overall_score:.4f}")

# Batch evaluation
qa_pairs = [
    {"question": "What is the main topic?"},
    {"question": "When was it published?"}
]
deepseek_results, lighton_results = evaluator.evaluate_batch(
    qa_pairs,
    deepseek_answers=["Answer 1", "Answer 2"],
    lighton_answers=["Answer 1", "Answer 2"],
    contexts=["Context 1", "Context 2"]
)

# Compare pipelines
comparison = evaluator.compare_pipelines(deepseek_results, lighton_results)
evaluator.print_evaluation_report(comparison)
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# LLM API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Vector Database
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=optional_api_key

# Benchmark Settings
BENCHMARK_OUTPUT_DIR=./results
BENCHMARK_BATCH_SIZE=10
BENCHMARK_TIMEOUT=300

# Logging
LOG_LEVEL=INFO
LOG_FILE=benchmark.log
```

### Benchmark Configuration

Customize benchmark behavior in `benchmark_config.yaml`:

```yaml
deepseek:
  compression_ratio: 4.0
  llm_provider: gemini
  llm_model: gemini-pro
  device: cuda

lighton:
  ocr_model: lightonai/LightOnOCR-1B-1025
  embedding_model: all-MiniLM-L6-v2
  chunk_size: 512
  chunk_overlap: 100
  use_embedded_db: true

evaluation:
  metrics:
    - faithfulness
    - answer_relevancy
    - context_precision
    - context_recall
  batch_size: 10
  timeout: 300

output:
  format: [json, csv]
  directory: ./results
  include_raw_results: true
  include_summary: true
```

## Dataset Preparation

### Golden Dataset Structure

```
benchmark_data/
├── golden_dataset/
│   ├── documents/
│   │   ├── doc_001.jpg
│   │   ├── doc_002.jpg
│   │   └── ... (50 documents total)
│   ├── qa_pairs.json
│   ├── ground_truth.json
│   └── metadata.json
```

### QA Pairs Format

```json
{
  "documents": [
    {
      "id": "doc_001",
      "domain": "finance",
      "qa_pairs": [
        {
          "question": "What is the main topic?",
          "ground_truth": "The document discusses quarterly financial results.",
          "difficulty": "easy"
        },
        {
          "question": "What was the revenue increase?",
          "ground_truth": "Revenue increased by 15% year-over-year.",
          "difficulty": "medium"
        }
      ]
    }
  ]
}
```

### Creating Your Own Dataset

```python
from src.benchmark_utils import DatasetBuilder

builder = DatasetBuilder(output_dir="benchmark_data/custom_dataset")

# Add documents
builder.add_document(
    image_path="path/to/document.jpg",
    document_id="doc_001",
    domain="finance"
)

# Add Q&A pairs
builder.add_qa_pair(
    document_id="doc_001",
    question="What is the main topic?",
    ground_truth="The document discusses quarterly financial results.",
    difficulty="easy"
)

# Save dataset
builder.save()
```

## Running Benchmarks

### Single Document Benchmark

```bash
python -m src.benchmark_orchestrator \
  --mode single \
  --image path/to/document.jpg \
  --queries "What is the main topic?" "When was it published?" \
  --output results/
```

### Batch Benchmark

```bash
python -m src.benchmark_orchestrator \
  --mode batch \
  --dataset benchmark_data/golden_dataset \
  --output results/ \
  --format json,csv \
  --workers 4  # Parallel processing
```

### Continuous Benchmarking

```bash
python -m src.benchmark_orchestrator \
  --mode continuous \
  --dataset benchmark_data/golden_dataset \
  --output results/ \
  --interval 3600  # Run every hour
  --watch-dir documents/  # Monitor for new documents
```

## Results Analysis

### Generated Output Files

**JSON Results** (`benchmark_results_*.json`):
```json
{
  "document_id": "doc_001",
  "timestamp": "2024-01-15T10:30:00",
  "metrics": {
    "deepseek_compression_ratio": 4.2,
    "deepseek_total_time_ms": 1240,
    "deepseek_cost_usd": 0.0043,
    "lighton_total_time_ms": 2850,
    "lighton_cost_usd": 0.0108,
    "token_reduction_percent": 75.0,
    "latency_improvement_percent": 56.5,
    "cost_savings_percent": 60.2
  },
  "quality_metrics": {
    "deepseek_faithfulness": 0.942,
    "deepseek_relevancy": 0.971,
    "lighton_faithfulness": 0.951,
    "lighton_relevancy": 0.968
  }
}
```

**CSV Metrics** (`benchmark_metrics_*.csv`):
```
document_id,timestamp,deepseek_compression_ratio,deepseek_total_time_ms,deepseek_cost_usd,...
doc_001,2024-01-15T10:30:00,4.2,1240,0.0043,...
doc_002,2024-01-15T10:35:00,4.1,1210,0.0041,...
```

### Analysis Scripts

```bash
# Generate summary report
python -m src.generate_benchmark_report \
  --results results/ \
  --output benchmark_report.md

# Generate visualizations
python -m src.generate_visualizations \
  --results results/ \
  --output results/charts/

# Statistical analysis
python -m src.statistical_analysis \
  --results results/ \
  --output results/statistics.json
```

## Integration with Metrics Dashboard

The benchmark results can be visualized in the AI-OCR Metrics Dashboard:

### Adding Benchmark Component

```jsx
// In ai-ocr-metrics-dashboard/src/App.jsx
import BenchmarkComparison from './components/BenchmarkComparison'

function App() {
  return (
    <div>
      {/* ... other components ... */}
      <BenchmarkComparison />
    </div>
  )
}
```

### Connecting Real Data

```jsx
// In BenchmarkComparison.jsx
useEffect(() => {
  const fetchBenchmarkData = async () => {
    const response = await fetch('/api/benchmark/results')
    const data = await response.json()
    setBenchmarkData(data)
  }
  
  fetchBenchmarkData()
}, [])
```

### Backend API Endpoint

```python
# In FastAPI backend
from fastapi import APIRouter
from src.benchmark_orchestrator import BenchmarkOrchestrator

router = APIRouter(prefix="/api/benchmark")

@router.get("/results")
async def get_benchmark_results():
    orchestrator = BenchmarkOrchestrator()
    summary = orchestrator.generate_summary_report()
    return summary

@router.get("/results/{document_id}")
async def get_document_benchmark(document_id: str):
    # Load specific benchmark result
    pass

@router.post("/run")
async def run_benchmark(image_path: str, queries: List[str]):
    orchestrator = BenchmarkOrchestrator()
    result = orchestrator.run_benchmark(image_path, queries)
    return result
```

## Troubleshooting

### Common Issues

**Issue: LightOnOCR model not found**
```bash
# Solution: Download model
python -c "from transformers import AutoModelForCausalLM; AutoModelForCausalLM.from_pretrained('lightonai/LightOnOCR-1B-1025')"
```

**Issue: Vector database connection failed**
```bash
# Solution: Start Weaviate
docker run -d -p 8080:8080 semitechnologies/weaviate:latest
```

**Issue: Out of memory during processing**
```bash
# Solution: Reduce batch size or use CPU
export CUDA_VISIBLE_DEVICES=""  # Use CPU
# Or reduce batch size in config
```

**Issue: API rate limits exceeded**
```bash
# Solution: Implement backoff and retry
# In benchmark_config.yaml:
api:
  max_retries: 3
  backoff_factor: 2
  rate_limit: 100  # requests per minute
```

## Performance Optimization

### Parallel Processing

```bash
# Run benchmarks in parallel
python -m src.benchmark_orchestrator \
  --mode batch \
  --dataset benchmark_data/golden_dataset \
  --workers 8  # Use 8 parallel workers
```

### Caching

```python
# Enable caching for embeddings
from src.benchmark_utils import CacheManager

cache = CacheManager(cache_dir="./cache")

# Embeddings are cached automatically
embeddings = cache.get_embeddings(text)
```

### Batch Processing

```python
# Process documents in batches
orchestrator.run_batch_benchmark(
    image_paths,
    batch_size=10,
    workers=4
)
```

## Monitoring & Logging

### Enable Detailed Logging

```bash
# Set log level
export LOG_LEVEL=DEBUG

# Run benchmark with logging
python -m src.benchmark_orchestrator \
  --dataset benchmark_data/golden_dataset \
  --log-file benchmark.log \
  --log-level DEBUG
```

### Monitoring Metrics

```python
from src.benchmark_utils import MetricsMonitor

monitor = MetricsMonitor()

# Track metrics in real-time
with monitor.track_benchmark():
    result = orchestrator.run_benchmark(image_path)
    
# View metrics
monitor.print_summary()
```

## Next Steps

1. **Prepare Dataset**: Create your golden dataset with representative documents
2. **Run Baseline**: Execute initial benchmark to establish baseline metrics
3. **Integrate Dashboard**: Connect benchmark results to metrics dashboard
4. **Continuous Monitoring**: Set up scheduled benchmarks for ongoing validation
5. **Optimize**: Use results to optimize compression algorithms and parameters

## Support & Resources

- **Documentation**: See `BENCHMARK_METHODOLOGY.md` for detailed methodology
- **Architecture**: See `BENCHMARK_ARCHITECTURE.md` for system design
- **Code**: Review source files in `src/` for implementation details
- **Issues**: Report issues on GitHub with benchmark logs

## References

- [DeepSeek-OCR Paper](https://arxiv.org/abs/2406.06495)
- [LightOnOCR Model Card](https://huggingface.co/lightonai/LightOnOCR-1B-1025)
- [Ragas Framework](https://docs.ragas.io/)
- [Langfuse Documentation](https://langfuse.com/docs)

---

**Version**: 1.0  
**Last Updated**: 2024-01-15  
**Status**: Production Ready

