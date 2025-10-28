from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import os
import logging
import time
import uuid
from typing import Dict, Any

# Assuming the core logic is in these files
# from .benchmark_orchestrator import BenchmarkOrchestrator
# from .ragas_evaluator import RagasEvaluator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-OCR Service",
    description="API for DeepSeek-OCR and LLM integration for document processing, benchmarking, and metrics.",
    version="1.0.0",
)

# --- Data Models ---

class OCRRequest(BaseModel):
    document_path: str
    llm_model: str  # "gemini" or "gpt"

class OCRResponse(BaseModel):
    status: str
    result: str
    kpi_processing_time_ms: int

class BenchmarkRequest(BaseModel):
    dataset_path: str
    pipelines: list[str] = ["deepseek", "lighton"]

class BenchmarkRun(BaseModel):
    run_id: str
    status: str
    message: str

class BenchmarkResult(BaseModel):
    run_id: str
    status: str
    results: Dict[str, Any]

# --- Mock Database ---
# In a real application, you would use a proper database like Redis or a file-based store.
benchmark_runs: Dict[str, Dict[str, Any]] = {}

# --- Helper Functions ---

def run_benchmark_in_background(run_id: str, dataset_path: str, pipelines: list[str]):
    """Simulates a long-running benchmark process."""
    logger.info(f"Starting benchmark run {run_id}...")
    benchmark_runs[run_id] = {"status": "running", "results": {}}
    
    # Mock benchmark execution
    time.sleep(15)  # Simulate a long process
    
    # Mock results generation
    mock_results = {
        "deepseek": {"accuracy": 0.95, "latency_ms": 1200, "cost_usd": 0.05},
        "lighton": {"accuracy": 0.92, "latency_ms": 800, "cost_usd": 0.02},
        "summary": "DeepSeek showed higher accuracy but also higher latency and cost."
    }
    
    benchmark_runs[run_id]["status"] = "completed"
    benchmark_runs[run_id]["results"] = mock_results
    logger.info(f"Benchmark run {run_id} completed.")

# --- API Endpoints ---

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "AI-OCR Backend"}

@app.post("/process_document", response_model=OCRResponse)
async def process_document(request: OCRRequest):
    """Processes a document using a specified OCR and LLM pipeline."""
    logger.info(f"Received request to process document: {request.document_path} with {request.llm_model}")
    
    start_time = time.time()
    
    if request.llm_model not in ["gemini", "gpt"]:
        return OCRResponse(
            status="error",
            result=f"Invalid LLM model: {request.llm_model}. Must be 'gemini' or 'gpt'.",
            kpi_processing_time_ms=0
        )

    time.sleep(1.5)  # Simulate processing
    
    end_time = time.time()
    processing_time_ms = int((end_time - start_time) * 1000)
    
    mock_result = f"Document at {request.document_path} processed successfully by {request.llm_model}. Summary: [Mock LLM Summary]"
    
    return OCRResponse(
        status="success",
        result=mock_result,
        kpi_processing_time_ms=processing_time_ms
    )

@app.post("/benchmark/run", response_model=BenchmarkRun)
async def start_benchmark(request: BenchmarkRequest, background_tasks: BackgroundTasks):
    """Starts a new benchmark run in the background."""
    run_id = str(uuid.uuid4())
    logger.info(f"Initiating benchmark run with ID: {run_id}")
    
    background_tasks.add_task(run_benchmark_in_background, run_id, request.dataset_path, request.pipelines)
    
    return BenchmarkRun(
        run_id=run_id,
        status="started",
        message="Benchmark run has been started in the background. Check status using the /benchmark/results/{run_id} endpoint."
    )

@app.get("/benchmark/results/{run_id}", response_model=BenchmarkResult)
async def get_benchmark_results(run_id: str):
    """Retrieves the status and results of a benchmark run."""
    run = benchmark_runs.get(run_id)
    if not run:
        return BenchmarkResult(run_id=run_id, status="not_found", results={})
    
    return BenchmarkResult(run_id=run_id, status=run["status"], results=run["results"])

@app.get("/metrics/aggregate")
async def get_aggregated_metrics():
    """Retrieves aggregated metrics from all completed benchmark runs."""
    completed_runs = [run["results"] for run in benchmark_runs.values() if run["status"] == "completed"]
    
    if not completed_runs:
        return {"status": "no_data", "message": "No completed benchmark runs found to aggregate."}
        
    # Mock aggregation logic
    total_runs = len(completed_runs)
    avg_accuracy_deepseek = sum(run["deepseek"]["accuracy"] for run in completed_runs) / total_runs
    avg_latency_lighton = sum(run["lighton"]["latency_ms"] for run in completed_runs) / total_runs
    
    return {
        "status": "success",
        "total_completed_runs": total_runs,
        "aggregated_metrics": {
            "deepseek_avg_accuracy": avg_accuracy_deepseek,
            "lighton_avg_latency_ms": avg_latency_lighton,
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
