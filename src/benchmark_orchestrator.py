"""
Benchmark Orchestrator Module

Coordinates execution of both DeepSeek-OCR and LightOnOCR pipelines,
collects metrics, and prepares data for comparative analysis.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import csv
from pathlib import Path
import concurrent.futures

from deepseek_ocr_pipeline import DeepSeekCompressionPipeline, DeepSeekPipelineResult
from lighton_ocr_pipeline import LightOnRAGPipeline, LightOnPipelineResult

logger = logging.getLogger(__name__)


@dataclass
class BenchmarkMetrics:
    """Aggregated metrics from both pipelines"""
    document_id: str
    timestamp: str
    
    # DeepSeek metrics
    deepseek_ocr_time_ms: float
    deepseek_compression_ratio: float
    deepseek_total_tokens: int
    deepseek_total_time_ms: float
    deepseek_cost_usd: float
    
    # LightOn metrics
    lighton_ocr_time_ms: float
    lighton_chunk_count: int
    lighton_total_tokens: int
    lighton_total_time_ms: float
    lighton_cost_usd: float
    
    # Comparative metrics
    token_reduction_percent: float
    latency_improvement_percent: float
    cost_savings_percent: float
    
    # Quality metrics (populated later by Ragas)
    deepseek_faithfulness: Optional[float] = None
    deepseek_relevancy: Optional[float] = None
    deepseek_context_precision: Optional[float] = None
    deepseek_context_recall: Optional[float] = None
    
    lighton_faithfulness: Optional[float] = None
    lighton_relevancy: Optional[float] = None
    lighton_context_precision: Optional[float] = None
    lighton_context_recall: Optional[float] = None


@dataclass
class BenchmarkResult:
    """Complete benchmark result for a document"""
    document_id: str
    timestamp: str
    image_path: str
    
    deepseek_result: DeepSeekPipelineResult
    lighton_result: LightOnPipelineResult
    
    metrics: BenchmarkMetrics
    
    # Query results (if applicable)
    query: Optional[str] = None
    deepseek_answer: Optional[str] = None
    lighton_answer: Optional[str] = None


class BenchmarkOrchestrator:
    """
    Orchestrates benchmark execution for both pipelines.
    
    Manages document processing, metric collection, and result aggregation.
    """
    
    def __init__(
        self,
        output_dir: str = "./benchmark_results",
        deepseek_config: Optional[Dict] = None,
        lighton_config: Optional[Dict] = None
    ):
        """
        Initialize benchmark orchestrator.
        
        Args:
            output_dir: Directory for benchmark results
            deepseek_config: Configuration for DeepSeek pipeline
            lighton_config: Configuration for LightOn pipeline
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize pipelines
        deepseek_config = deepseek_config or {}
        lighton_config = lighton_config or {}
        
        logger.info("Initializing DeepSeek-OCR pipeline")
        self.deepseek_pipeline = DeepSeekCompressionPipeline(**deepseek_config)
        
        logger.info("Initializing LightOn-OCR pipeline")
        self.lighton_pipeline = LightOnRAGPipeline(**lighton_config)
        
        # Results storage
        self.results: List[BenchmarkResult] = []
        self.metrics: List[BenchmarkMetrics] = []
    
    def run_benchmark(
        self,
        image_path: str,
        document_id: Optional[str] = None,
        queries: Optional[List[str]] = None
    ) -> BenchmarkResult:
        """
        Run benchmark on a single document.
        
        Args:
            image_path: Path to document image
            document_id: Optional document identifier
            queries: Optional list of queries to answer
            
        Returns:
            BenchmarkResult with metrics from both pipelines
        """
        logger.info(f"Starting benchmark for: {image_path}")
        
        timestamp = datetime.now().isoformat()
        
        # Process with DeepSeek pipeline
        logger.info("Processing with DeepSeek-OCR pipeline")
        deepseek_result = self.deepseek_pipeline.process_document(
            image_path,
            document_id
        )
        
        # Process with LightOn pipeline
        logger.info("Processing with LightOn-OCR pipeline")
        lighton_result = self.lighton_pipeline.process_document(
            image_path,
            document_id
        )
        
        # Aggregate metrics
        metrics = self._aggregate_metrics(
            deepseek_result,
            lighton_result,
            timestamp
        )
        
        # Process queries if provided
        deepseek_answer = None
        lighton_answer = None
        query_text = None
        
        if queries:
            query_text = queries[0]  # Use first query for benchmark
            
            logger.info(f"Answering query: {query_text}")
            
            # DeepSeek answer
            deepseek_llm_result = self.deepseek_pipeline.answer_query(
                deepseek_result.compression_result.compressed_representation,
                query_text
            )
            deepseek_answer = deepseek_llm_result.answer
            
            # LightOn answer
            lighton_chunks, lighton_scores = self.lighton_pipeline.query(
                query_text
            )
            lighton_context = " ".join(lighton_chunks)
            lighton_llm_result = self.deepseek_pipeline.llm_processor.process(
                lighton_context,
                query_text
            )
            lighton_answer = lighton_llm_result.answer
        
        # Create benchmark result
        result = BenchmarkResult(
            document_id=deepseek_result.pipeline_id,
            timestamp=timestamp,
            image_path=image_path,
            deepseek_result=deepseek_result,
            lighton_result=lighton_result,
            metrics=metrics,
            query=query_text,
            deepseek_answer=deepseek_answer,
            lighton_answer=lighton_answer
        )
        
        # Store results
        self.results.append(result)
        self.metrics.append(metrics)
        
        logger.info(f"Benchmark completed for: {image_path}")
        logger.info(f"Compression ratio: {metrics.deepseek_compression_ratio:.2f}x")
        logger.info(f"Latency improvement: {metrics.latency_improvement_percent:.1f}%")
        logger.info(f"Cost savings: {metrics.cost_savings_percent:.1f}%")
        
        return result
    
    def run_batch_benchmark(
        self,
        image_paths: List[str],
        queries: Optional[List[str]] = None,
        max_workers: int = 4
    ) -> List[BenchmarkResult]:
        """
        Run benchmark on multiple documents in parallel.
        
        Args:
            image_paths: List of image file paths
            queries: Optional queries to answer for each document
            max_workers: Maximum number of parallel workers
            
        Returns:
            List of BenchmarkResult objects
        """
        results = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_image = {
                executor.submit(self.run_benchmark, image_path, queries=queries): image_path
                for image_path in image_paths
            }
            
            for future in concurrent.futures.as_completed(future_to_image):
                image_path = future_to_image[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error processing {image_path}: {e}")
        
        return results
    
    def _aggregate_metrics(
        self,
        deepseek_result: DeepSeekPipelineResult,
        lighton_result: LightOnPipelineResult,
        timestamp: str
    ) -> BenchmarkMetrics:
        """
        Aggregate metrics from both pipelines.
        
        Args:
            deepseek_result: DeepSeek pipeline result
            lighton_result: LightOn pipeline result
            timestamp: Timestamp of benchmark
            
        Returns:
            Aggregated BenchmarkMetrics
        """
        # Calculate comparative metrics
        token_reduction = (
            (lighton_result.total_tokens - deepseek_result.total_tokens) /
            lighton_result.total_tokens * 100
        )
        
        latency_improvement = (
            (lighton_result.total_time_ms - deepseek_result.total_time_ms) /
            lighton_result.total_time_ms * 100
        )
        
        # Estimate costs (mock values for now)
        deepseek_cost = deepseek_result.total_cost_usd or self._estimate_cost(
            deepseek_result.total_tokens,
            "gemini"
        )
        
        lighton_cost = self._estimate_cost(
            lighton_result.total_tokens,
            "gemini"
        )
        
        cost_savings = (
            (lighton_cost - deepseek_cost) / lighton_cost * 100
        )
        
        return BenchmarkMetrics(
            document_id=deepseek_result.pipeline_id,
            timestamp=timestamp,
            deepseek_ocr_time_ms=deepseek_result.ocr_result.processing_time_ms,
            deepseek_compression_ratio=deepseek_result.ocr_result.compression_ratio,
            deepseek_total_tokens=deepseek_result.total_tokens,
            deepseek_total_time_ms=deepseek_result.total_time_ms,
            deepseek_cost_usd=deepseek_cost,
            lighton_ocr_time_ms=lighton_result.ocr_result.processing_time_ms,
            lighton_chunk_count=lighton_result.chunk_result.chunk_count,
            lighton_total_tokens=lighton_result.total_tokens,
            lighton_total_time_ms=lighton_result.total_time_ms,
            lighton_cost_usd=lighton_cost,
            token_reduction_percent=token_reduction,
            latency_improvement_percent=latency_improvement,
            cost_savings_percent=cost_savings
        )
    
    def _estimate_cost(self, token_count: int, provider: str) -> float:
        """
        Estimate API cost for token usage.
        
        Args:
            token_count: Number of tokens
            provider: LLM provider
            
        Returns:
            Estimated cost in USD
        """
        # Pricing as of 2024
        pricing = {
            "gemini": 0.00075 / 1000,  # $0.00075 per 1k input tokens
            "gpt-4": 0.03 / 1000,      # $0.03 per 1k input tokens
            "gpt-4-turbo": 0.01 / 1000 # $0.01 per 1k input tokens
        }
        
        rate = pricing.get(provider, pricing["gemini"])
        return token_count * rate
    
    def save_results(self, format: str = "json"):
        """
        Save benchmark results to file.
        
        Args:
            format: Output format ("json" or "csv")
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format == "json":
            self._save_json_results(timestamp)
        elif format == "csv":
            self._save_csv_results(timestamp)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _save_json_results(self, timestamp: str):
        """Save results as JSON."""
        output_file = self.output_dir / f"benchmark_results_{timestamp}.json"
        
        # Convert results to serializable format
        results_data = []
        for result in self.results:
            results_data.append({
                "document_id": result.document_id,
                "timestamp": result.timestamp,
                "image_path": result.image_path,
                "metrics": asdict(result.metrics),
                "query": result.query,
                "deepseek_answer": result.deepseek_answer,
                "lighton_answer": result.lighton_answer
            })
        
        with open(output_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        logger.info(f"Results saved to: {output_file}")
    
    def _save_csv_results(self, timestamp: str):
        """Save results as CSV."""
        output_file = self.output_dir / f"benchmark_metrics_{timestamp}.csv"
        
        if not self.metrics:
            logger.warning("No metrics to save")
            return
        
        # Get field names from first metric
        fieldnames = list(asdict(self.metrics[0]).keys())
        
        with open(output_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for metric in self.metrics:
                writer.writerow(asdict(metric))
        
        logger.info(f"Metrics saved to: {output_file}")
    
    def generate_summary_report(self) -> Dict:
        """
        Generate summary statistics from all benchmarks.
        
        Returns:
            Dictionary with summary statistics
        """
        if not self.metrics:
            logger.warning("No metrics available for summary")
            return {}
        
        # Calculate averages
        avg_compression = sum(m.deepseek_compression_ratio for m in self.metrics) / len(self.metrics)
        avg_token_reduction = sum(m.token_reduction_percent for m in self.metrics) / len(self.metrics)
        avg_latency_improvement = sum(m.latency_improvement_percent for m in self.metrics) / len(self.metrics)
        avg_cost_savings = sum(m.cost_savings_percent for m in self.metrics) / len(self.metrics)
        
        # Calculate totals
        total_deepseek_cost = sum(m.deepseek_cost_usd for m in self.metrics)
        total_lighton_cost = sum(m.lighton_cost_usd for m in self.metrics)
        
        summary = {
            "benchmark_count": len(self.metrics),
            "timestamp": datetime.now().isoformat(),
            "efficiency_metrics": {
                "avg_compression_ratio": round(avg_compression, 2),
                "avg_token_reduction_percent": round(avg_token_reduction, 1),
                "avg_latency_improvement_percent": round(avg_latency_improvement, 1),
                "avg_cost_savings_percent": round(avg_cost_savings, 1)
            },
            "cost_analysis": {
                "total_deepseek_cost_usd": round(total_deepseek_cost, 4),
                "total_lighton_cost_usd": round(total_lighton_cost, 4),
                "total_savings_usd": round(total_lighton_cost - total_deepseek_cost, 4)
            },
            "latency_analysis": {
                "avg_deepseek_time_ms": round(
                    sum(m.deepseek_total_time_ms for m in self.metrics) / len(self.metrics), 1
                ),
                "avg_lighton_time_ms": round(
                    sum(m.lighton_total_time_ms for m in self.metrics) / len(self.metrics), 1
                )
            }
        }
        
        return summary
    
    def print_summary(self):
        """Print summary report to console."""
        summary = self.generate_summary_report()
        
        print("\n" + "="*70)
        print("BENCHMARK SUMMARY REPORT")
        print("="*70)
        
        print(f"\nDocuments Processed: {summary.get('benchmark_count', 0)}")
        print(f"Timestamp: {summary.get('timestamp', 'N/A')}")
        
        print("\n--- Efficiency Metrics ---")
        eff = summary.get('efficiency_metrics', {})
        print(f"Average Compression Ratio: {eff.get('avg_compression_ratio', 'N/A')}x")
        print(f"Average Token Reduction: {eff.get('avg_token_reduction_percent', 'N/A')}%")
        print(f"Average Latency Improvement: {eff.get('avg_latency_improvement_percent', 'N/A')}%")
        print(f"Average Cost Savings: {eff.get('avg_cost_savings_percent', 'N/A')}%")
        
        print("\n--- Cost Analysis ---")
        cost = summary.get('cost_analysis', {})
        print(f"Total DeepSeek Cost: ${cost.get('total_deepseek_cost_usd', 'N/A')}")
        print(f"Total LightOn Cost: ${cost.get('total_lighton_cost_usd', 'N/A')}")
        print(f"Total Savings: ${cost.get('total_savings_usd', 'N/A')}")
        
        print("\n--- Latency Analysis ---")
        latency = summary.get('latency_analysis', {})
        print(f"Average DeepSeek Time: {latency.get('avg_deepseek_time_ms', 'N/A')}ms")
        print(f"Average LightOn Time: {latency.get('avg_lighton_time_ms', 'N/A')}ms")
        
        print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Example usage
    orchestrator = BenchmarkOrchestrator()
    
    # Run benchmark on single document
    # result = orchestrator.run_benchmark(
    #     "path/to/image.jpg",
    #     queries=["What is the main topic?"]
    # )
    
    # Run batch benchmark
    # image_paths = ["image1.jpg", "image2.jpg", "image3.jpg"]
    # results = orchestrator.run_batch_benchmark(image_paths)
    
    # Save results
    # orchestrator.save_results(format="json")
    # orchestrator.save_results(format="csv")
    
    # Print summary
    # orchestrator.print_summary()

