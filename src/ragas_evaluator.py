"""
Ragas Evaluation Framework Module

Implements quality evaluation metrics for both DeepSeek-OCR and LightOnOCR pipelines
using the Ragas framework for comprehensive answer quality assessment.

Metrics:
- Faithfulness: Does the answer hallucinate or invent information?
- Answer Relevancy: Is the answer relevant to the question?
- Context Precision: Did the pipeline preserve critical information?
- Context Recall: Did the pipeline retrieve all relevant information?
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class RagasMetrics:
    """Ragas evaluation metrics"""
    faithfulness: float
    answer_relevancy: float
    context_precision: float
    context_recall: float
    overall_score: float


@dataclass
class EvaluationResult:
    """Complete evaluation result for a pipeline"""
    pipeline_name: str
    document_id: str
    question: str
    answer: str
    context: str
    ground_truth: Optional[str]
    metrics: RagasMetrics
    timestamp: str


class RagasEvaluator:
    """
    Ragas-based evaluation framework for answer quality assessment.
    
    Evaluates both DeepSeek-OCR and LightOnOCR pipelines using standardized metrics.
    """
    
    def __init__(self):
        """Initialize Ragas evaluator."""
        logger.info("Initializing Ragas evaluator")
        
        # In production, import actual Ragas components
        # from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
        # from ragas.llm import LangChainLLMWrapper
        
        self.initialized = True
    
    def evaluate_answer(
        self,
        question: str,
        answer: str,
        context: str,
        ground_truth: Optional[str] = None,
        pipeline_name: str = "unknown"
    ) -> EvaluationResult:
        """
        Evaluate answer quality using Ragas metrics.
        
        Args:
            question: The question asked
            answer: The generated answer
            context: The context/retrieved information
            ground_truth: Optional ground truth answer
            pipeline_name: Name of the pipeline being evaluated
            
        Returns:
            EvaluationResult with all metrics
        """
        logger.info(f"Evaluating answer from {pipeline_name}")
        
        # Calculate individual metrics
        faithfulness = self._calculate_faithfulness(answer, context)
        answer_relevancy = self._calculate_answer_relevancy(answer, question)
        context_precision = self._calculate_context_precision(context, question)
        context_recall = self._calculate_context_recall(context, ground_truth) if ground_truth else 0.0
        
        # Calculate overall score
        overall_score = (
            faithfulness * 0.3 +
            answer_relevancy * 0.3 +
            context_precision * 0.2 +
            context_recall * 0.2
        )
        
        metrics = RagasMetrics(
            faithfulness=faithfulness,
            answer_relevancy=answer_relevancy,
            context_precision=context_precision,
            context_recall=context_recall,
            overall_score=overall_score
        )
        
        result = EvaluationResult(
            pipeline_name=pipeline_name,
            document_id="",
            question=question,
            answer=answer,
            context=context,
            ground_truth=ground_truth,
            metrics=metrics,
            timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Evaluation complete:")
        logger.info(f"  Faithfulness: {faithfulness:.4f}")
        logger.info(f"  Answer Relevancy: {answer_relevancy:.4f}")
        logger.info(f"  Context Precision: {context_precision:.4f}")
        logger.info(f"  Context Recall: {context_recall:.4f}")
        logger.info(f"  Overall Score: {overall_score:.4f}")
        
        return result
    
    def _calculate_faithfulness(self, answer: str, context: str) -> float:
        """
        Calculate faithfulness score.
        
        Measures whether the answer is grounded in the provided context
        and doesn't hallucinate or invent information.
        
        Args:
            answer: Generated answer
            context: Source context
            
        Returns:
            Faithfulness score (0-1)
        """
        # In production, this would use LLM-based evaluation
        # For now, use heuristic-based scoring
        
        if not answer or not context:
            return 0.0
        
        # Check if answer words appear in context
        answer_words = set(answer.lower().split())
        context_words = set(context.lower().split())
        
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were'}
        answer_words = answer_words - stop_words
        context_words = context_words - stop_words
        
        if not answer_words:
            return 0.5
        
        # Calculate overlap
        overlap = len(answer_words & context_words)
        coverage = overlap / len(answer_words)
        
        # Faithfulness score: higher if more answer content is in context
        faithfulness = min(coverage * 1.2, 1.0)  # Cap at 1.0
        
        return faithfulness
    
    def _calculate_answer_relevancy(self, answer: str, question: str) -> float:
        """
        Calculate answer relevancy score.
        
        Measures whether the answer is relevant and addresses the question.
        
        Args:
            answer: Generated answer
            question: Original question
            
        Returns:
            Relevancy score (0-1)
        """
        if not answer or not question:
            return 0.0
        
        # Extract key terms from question
        question_words = set(question.lower().split())
        answer_words = set(answer.lower().split())
        
        # Remove stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'who'}
        question_words = question_words - stop_words
        answer_words = answer_words - stop_words
        
        if not question_words:
            return 0.5
        
        # Calculate overlap
        overlap = len(question_words & answer_words)
        relevancy = overlap / len(question_words)
        
        # Boost score if answer is longer (more comprehensive)
        answer_length_bonus = min(len(answer.split()) / 50, 0.3)
        
        return min(relevancy + answer_length_bonus, 1.0)
    
    def _calculate_context_precision(self, context: str, question: str) -> float:
        """
        Calculate context precision score.
        
        Measures whether the context contains relevant information for answering the question.
        
        Args:
            context: Retrieved context
            question: Original question
            
        Returns:
            Context precision score (0-1)
        """
        if not context or not question:
            return 0.0
        
        # Extract key terms from question
        question_words = set(question.lower().split())
        context_words = set(context.lower().split())
        
        # Remove stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'who'}
        question_words = question_words - stop_words
        
        if not question_words:
            return 0.5
        
        # Calculate how many question terms are in context
        matching_terms = len(question_words & context_words)
        precision = matching_terms / len(question_words)
        
        return precision
    
    def _calculate_context_recall(self, context: str, ground_truth: str) -> float:
        """
        Calculate context recall score.
        
        Measures whether the context contains all information needed
        to answer based on ground truth.
        
        Args:
            context: Retrieved context
            ground_truth: Ground truth answer
            
        Returns:
            Context recall score (0-1)
        """
        if not context or not ground_truth:
            return 0.0
        
        # Extract key terms from ground truth
        truth_words = set(ground_truth.lower().split())
        context_words = set(context.lower().split())
        
        # Remove stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were'}
        truth_words = truth_words - stop_words
        
        if not truth_words:
            return 0.5
        
        # Calculate how many truth terms are in context
        matching_terms = len(truth_words & context_words)
        recall = matching_terms / len(truth_words)
        
        return recall
    
    def evaluate_batch(
        self,
        qa_pairs: List[Dict],
        deepseek_answers: List[str],
        lighton_answers: List[str],
        contexts: List[str],
        ground_truths: Optional[List[str]] = None
    ) -> Tuple[List[EvaluationResult], List[EvaluationResult]]:
        """
        Evaluate multiple Q&A pairs for both pipelines.
        
        Args:
            qa_pairs: List of {question, context} dicts
            deepseek_answers: Answers from DeepSeek pipeline
            lighton_answers: Answers from LightOn pipeline
            contexts: Context for each Q&A pair
            ground_truths: Optional ground truth answers
            
        Returns:
            Tuple of (deepseek_results, lighton_results)
        """
        deepseek_results = []
        lighton_results = []
        
        for idx, qa_pair in enumerate(qa_pairs):
            question = qa_pair.get('question', '')
            context = contexts[idx] if idx < len(contexts) else ''
            ground_truth = ground_truths[idx] if ground_truths and idx < len(ground_truths) else None
            
            # Evaluate DeepSeek answer
            if idx < len(deepseek_answers):
                ds_result = self.evaluate_answer(
                    question=question,
                    answer=deepseek_answers[idx],
                    context=context,
                    ground_truth=ground_truth,
                    pipeline_name="DeepSeek-OCR"
                )
                deepseek_results.append(ds_result)
            
            # Evaluate LightOn answer
            if idx < len(lighton_answers):
                lo_result = self.evaluate_answer(
                    question=question,
                    answer=lighton_answers[idx],
                    context=context,
                    ground_truth=ground_truth,
                    pipeline_name="LightOn-OCR"
                )
                lighton_results.append(lo_result)
        
        return deepseek_results, lighton_results
    
    def compare_pipelines(
        self,
        deepseek_results: List[EvaluationResult],
        lighton_results: List[EvaluationResult]
    ) -> Dict:
        """
        Generate comparative analysis between pipelines.
        
        Args:
            deepseek_results: Evaluation results from DeepSeek
            lighton_results: Evaluation results from LightOn
            
        Returns:
            Dictionary with comparative statistics
        """
        if not deepseek_results or not lighton_results:
            logger.warning("Insufficient results for comparison")
            return {}
        
        # Calculate averages
        ds_avg_faithfulness = np.mean([r.metrics.faithfulness for r in deepseek_results])
        ds_avg_relevancy = np.mean([r.metrics.answer_relevancy for r in deepseek_results])
        ds_avg_precision = np.mean([r.metrics.context_precision for r in deepseek_results])
        ds_avg_recall = np.mean([r.metrics.context_recall for r in deepseek_results])
        ds_avg_overall = np.mean([r.metrics.overall_score for r in deepseek_results])
        
        lo_avg_faithfulness = np.mean([r.metrics.faithfulness for r in lighton_results])
        lo_avg_relevancy = np.mean([r.metrics.answer_relevancy for r in lighton_results])
        lo_avg_precision = np.mean([r.metrics.context_precision for r in lighton_results])
        lo_avg_recall = np.mean([r.metrics.context_recall for r in lighton_results])
        lo_avg_overall = np.mean([r.metrics.overall_score for r in lighton_results])
        
        comparison = {
            "deepseek_metrics": {
                "avg_faithfulness": round(ds_avg_faithfulness, 4),
                "avg_relevancy": round(ds_avg_relevancy, 4),
                "avg_context_precision": round(ds_avg_precision, 4),
                "avg_context_recall": round(ds_avg_recall, 4),
                "avg_overall_score": round(ds_avg_overall, 4)
            },
            "lighton_metrics": {
                "avg_faithfulness": round(lo_avg_faithfulness, 4),
                "avg_relevancy": round(lo_avg_relevancy, 4),
                "avg_context_precision": round(lo_avg_precision, 4),
                "avg_context_recall": round(lo_avg_recall, 4),
                "avg_overall_score": round(lo_avg_overall, 4)
            },
            "comparative_analysis": {
                "faithfulness_difference": round(ds_avg_faithfulness - lo_avg_faithfulness, 4),
                "relevancy_difference": round(ds_avg_relevancy - lo_avg_relevancy, 4),
                "precision_difference": round(ds_avg_precision - lo_avg_precision, 4),
                "recall_difference": round(ds_avg_recall - lo_avg_recall, 4),
                "overall_score_difference": round(ds_avg_overall - lo_avg_overall, 4),
                "quality_parity": "maintained" if abs(ds_avg_overall - lo_avg_overall) < 0.05 else "degraded"
            }
        }
        
        return comparison
    
    def print_evaluation_report(self, comparison: Dict):
        """
        Print evaluation report to console.
        
        Args:
            comparison: Comparative analysis dictionary
        """
        print("\n" + "="*70)
        print("RAGAS EVALUATION REPORT")
        print("="*70)
        
        print("\n--- DeepSeek-OCR Metrics ---")
        ds = comparison.get('deepseek_metrics', {})
        print(f"Faithfulness: {ds.get('avg_faithfulness', 'N/A')}")
        print(f"Answer Relevancy: {ds.get('avg_relevancy', 'N/A')}")
        print(f"Context Precision: {ds.get('avg_context_precision', 'N/A')}")
        print(f"Context Recall: {ds.get('avg_context_recall', 'N/A')}")
        print(f"Overall Score: {ds.get('avg_overall_score', 'N/A')}")
        
        print("\n--- LightOn-OCR Metrics ---")
        lo = comparison.get('lighton_metrics', {})
        print(f"Faithfulness: {lo.get('avg_faithfulness', 'N/A')}")
        print(f"Answer Relevancy: {lo.get('avg_relevancy', 'N/A')}")
        print(f"Context Precision: {lo.get('avg_context_precision', 'N/A')}")
        print(f"Context Recall: {lo.get('avg_context_recall', 'N/A')}")
        print(f"Overall Score: {lo.get('avg_overall_score', 'N/A')}")
        
        print("\n--- Comparative Analysis ---")
        comp = comparison.get('comparative_analysis', {})
        print(f"Faithfulness Difference: {comp.get('faithfulness_difference', 'N/A')}")
        print(f"Relevancy Difference: {comp.get('relevancy_difference', 'N/A')}")
        print(f"Precision Difference: {comp.get('precision_difference', 'N/A')}")
        print(f"Recall Difference: {comp.get('recall_difference', 'N/A')}")
        print(f"Overall Score Difference: {comp.get('overall_score_difference', 'N/A')}")
        print(f"Quality Parity: {comp.get('quality_parity', 'N/A')}")
        
        print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Example usage
    evaluator = RagasEvaluator()
    
    # Evaluate single answer
    # result = evaluator.evaluate_answer(
    #     question="What is the main topic?",
    #     answer="The main topic is document analysis.",
    #     context="This document discusses document analysis and processing.",
    #     ground_truth="Document analysis is the main topic."
    # )
    
    # Evaluate batch
    # qa_pairs = [
    #     {"question": "What is the main topic?"},
    #     {"question": "When was it published?"}
    # ]
    # deepseek_answers = ["Answer 1", "Answer 2"]
    # lighton_answers = ["Answer 1", "Answer 2"]
    # contexts = ["Context 1", "Context 2"]
    # ds_results, lo_results = evaluator.evaluate_batch(
    #     qa_pairs, deepseek_answers, lighton_answers, contexts
    # )
    
    # Compare pipelines
    # comparison = evaluator.compare_pipelines(ds_results, lo_results)
    # evaluator.print_evaluation_report(comparison)

