"""
LightOnOCR Pipeline Module

Implements a traditional RAG pipeline using LightOnOCR for text extraction,
followed by chunking, embedding, and vector database retrieval.

This serves as the benchmark/control group for comparing against DeepSeek-OCR compression.
"""

import time
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib

import numpy as np
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM

# Vector database imports (using Weaviate as example)
try:
    import weaviate
    from weaviate.embedded import EmbeddedOptions
except ImportError:
    weaviate = None

# Embedding model
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

logger = logging.getLogger(__name__)


@dataclass
class OCRResult:
    """Result from OCR processing"""
    text: str
    confidence: float
    processing_time_ms: float
    model: str = "lighton-ocr"


@dataclass
class ChunkResult:
    """Result from text chunking"""
    chunks: List[str]
    chunk_count: int
    chunking_time_ms: float


@dataclass
class EmbeddingResult:
    """Result from embedding generation"""
    embeddings: np.ndarray
    embedding_dim: int
    embedding_time_ms: float
    total_tokens: int


@dataclass
class RetrievalResult:
    """Result from vector database retrieval"""
    retrieved_chunks: List[str]
    retrieval_scores: List[float]
    retrieval_time_ms: float
    chunks_retrieved: int


@dataclass
class LightOnPipelineResult:
    """Complete result from LightOn RAG pipeline"""
    ocr_result: OCRResult
    chunk_result: ChunkResult
    embedding_result: EmbeddingResult
    retrieval_result: RetrievalResult
    total_time_ms: float
    total_tokens: int
    pipeline_id: str


class LightOnOCRProcessor:
    """
    LightOnOCR model for text extraction from images.
    
    Uses the LightOnOCR-1B-1025 model from HuggingFace.
    """
    
    def __init__(self, model_name: str = "lightonai/LightOnOCR-1B-1025", device: str = "cuda"):
        """
        Initialize LightOnOCR processor.
        
        Args:
            model_name: HuggingFace model identifier
            device: Device to run model on ("cuda" or "cpu")
        """
        self.model_name = model_name
        self.device = device
        
        logger.info(f"Loading LightOnOCR model: {model_name}")
        
        try:
            self.processor = AutoProcessor.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                device_map=device
            )
            self.model.eval()
            logger.info("LightOnOCR model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load LightOnOCR model: {e}")
            raise
    
    def process_image(self, image_path: str) -> OCRResult:
        """
        Extract text from image using LightOnOCR.
        
        Args:
            image_path: Path to image file
            
        Returns:
            OCRResult with extracted text and metadata
        """
        start_time = time.time()
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert("RGB")
            
            # Prepare inputs
            inputs = self.processor(
                images=image,
                return_tensors="pt"
            ).to(self.device)
            
            # Generate text
            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    do_sample=False
                )
            
            # Decode output
            extracted_text = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=True
            )[0]
            
            processing_time_ms = (time.time() - start_time) * 1000
            
            return OCRResult(
                text=extracted_text,
                confidence=0.95,  # LightOnOCR doesn't provide confidence scores
                processing_time_ms=processing_time_ms
            )
        
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {e}")
            raise
    
    def process_batch(self, image_paths: List[str]) -> List[OCRResult]:
        """
        Process multiple images.
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of OCRResult objects
        """
        results = []
        for image_path in image_paths:
            result = self.process_image(image_path)
            results.append(result)
        return results


class TextChunker:
    """
    Semantic text chunking for RAG pipeline.
    
    Splits extracted text into overlapping chunks while preserving context.
    """
    
    def __init__(self, chunk_size: int = 512, overlap: int = 100):
        """
        Initialize text chunker.
        
        Args:
            chunk_size: Target size for each chunk (in characters)
            overlap: Number of overlapping characters between chunks
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_text(self, text: str) -> ChunkResult:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Text to chunk
            
        Returns:
            ChunkResult with chunks and metadata
        """
        start_time = time.time()
        
        chunks = []
        start_idx = 0
        
        while start_idx < len(text):
            # Calculate end index
            end_idx = min(start_idx + self.chunk_size, len(text))
            
            # Extract chunk
            chunk = text[start_idx:end_idx]
            chunks.append(chunk.strip())
            
            # Move start index with overlap
            start_idx = end_idx - self.overlap
            
            # Avoid infinite loop for very small texts
            if end_idx == len(text):
                break
        
        chunking_time_ms = (time.time() - start_time) * 1000
        
        return ChunkResult(
            chunks=chunks,
            chunk_count=len(chunks),
            chunking_time_ms=chunking_time_ms
        )


class EmbeddingGenerator:
    """
    Generate embeddings for text chunks using sentence transformers.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding generator.
        
        Args:
            model_name: Sentence transformer model name
        """
        if SentenceTransformer is None:
            raise ImportError("sentence-transformers not installed")
        
        self.model_name = model_name
        logger.info(f"Loading embedding model: {model_name}")
        
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        logger.info(f"Embedding dimension: {self.embedding_dim}")
    
    def embed_chunks(self, chunks: List[str]) -> EmbeddingResult:
        """
        Generate embeddings for text chunks.
        
        Args:
            chunks: List of text chunks
            
        Returns:
            EmbeddingResult with embeddings and metadata
        """
        start_time = time.time()
        
        # Generate embeddings
        embeddings = self.model.encode(
            chunks,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        
        embedding_time_ms = (time.time() - start_time) * 1000
        
        # Estimate token count (rough approximation)
        total_tokens = sum(len(chunk.split()) for chunk in chunks) * 1.3
        
        return EmbeddingResult(
            embeddings=embeddings,
            embedding_dim=self.embedding_dim,
            embedding_time_ms=embedding_time_ms,
            total_tokens=int(total_tokens)
        )


class VectorDatabaseManager:
    """
    Manage vector database operations for RAG retrieval.
    
    Uses Weaviate as the vector database backend.
    """
    
    def __init__(self, use_embedded: bool = True):
        """
        Initialize vector database manager.
        
        Args:
            use_embedded: Use embedded Weaviate (True) or remote (False)
        """
        if weaviate is None:
            raise ImportError("weaviate-client not installed")
        
        self.use_embedded = use_embedded
        
        if use_embedded:
            logger.info("Starting embedded Weaviate instance")
            self.client = weaviate.Client(
                embedded_options=EmbeddedOptions()
            )
        else:
            # For remote Weaviate, configure connection
            self.client = weaviate.Client(
                url="http://localhost:8080"
            )
        
        logger.info("Vector database initialized")
    
    def create_collection(self, collection_name: str, embedding_dim: int):
        """
        Create a new collection in the vector database.
        
        Args:
            collection_name: Name of the collection
            embedding_dim: Dimension of embeddings
        """
        try:
            # Check if collection exists
            if self.client.schema.exists(collection_name):
                logger.info(f"Collection {collection_name} already exists")
                return
            
            # Create collection schema
            class_obj = {
                "class": collection_name,
                "properties": [
                    {
                        "name": "content",
                        "dataType": ["text"],
                        "description": "Chunk content"
                    },
                    {
                        "name": "chunk_id",
                        "dataType": ["int"],
                        "description": "Chunk index"
                    },
                    {
                        "name": "document_id",
                        "dataType": ["text"],
                        "description": "Source document ID"
                    }
                ],
                "vectorizer": "none"  # We provide embeddings directly
            }
            
            self.client.schema.create_class(class_obj)
            logger.info(f"Collection {collection_name} created")
        
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            raise
    
    def add_chunks(
        self,
        collection_name: str,
        chunks: List[str],
        embeddings: np.ndarray,
        document_id: str
    ):
        """
        Add chunks and embeddings to vector database.
        
        Args:
            collection_name: Target collection name
            chunks: List of text chunks
            embeddings: Embedding vectors
            document_id: Source document identifier
        """
        try:
            with self.client.batch as batch:
                for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    data_obj = {
                        "content": chunk,
                        "chunk_id": idx,
                        "document_id": document_id
                    }
                    
                    batch.add_object(
                        class_name=collection_name,
                        data_object=data_obj,
                        vector=embedding.tolist()
                    )
            
            logger.info(f"Added {len(chunks)} chunks to {collection_name}")
        
        except Exception as e:
            logger.error(f"Error adding chunks to database: {e}")
            raise
    
    def retrieve_chunks(
        self,
        collection_name: str,
        query_embedding: np.ndarray,
        top_k: int = 5
    ) -> RetrievalResult:
        """
        Retrieve similar chunks from vector database.
        
        Args:
            collection_name: Collection to search
            query_embedding: Query embedding vector
            top_k: Number of chunks to retrieve
            
        Returns:
            RetrievalResult with retrieved chunks and scores
        """
        start_time = time.time()
        
        try:
            response = self.client.query.get(
                collection_name,
                ["content", "chunk_id", "_additional {distance}"]
            ).with_near_vector(
                {"vector": query_embedding.tolist()}
            ).with_limit(top_k).do()
            
            retrieval_time_ms = (time.time() - start_time) * 1000
            
            retrieved_chunks = []
            retrieval_scores = []
            
            if "data" in response and "Get" in response["data"]:
                for item in response["data"]["Get"][collection_name]:
                    retrieved_chunks.append(item["content"])
                    # Convert distance to similarity score
                    distance = item["_additional"]["distance"]
                    similarity = 1 / (1 + distance)
                    retrieval_scores.append(similarity)
            
            return RetrievalResult(
                retrieved_chunks=retrieved_chunks,
                retrieval_scores=retrieval_scores,
                retrieval_time_ms=retrieval_time_ms,
                chunks_retrieved=len(retrieved_chunks)
            )
        
        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}")
            raise


class LightOnRAGPipeline:
    """
    Complete LightOnOCR-based RAG pipeline.
    
    Orchestrates OCR, chunking, embedding, and retrieval for benchmark comparison.
    """
    
    def __init__(
        self,
        ocr_model: str = "lightonai/LightOnOCR-1B-1025",
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 512,
        chunk_overlap: int = 100,
        use_embedded_db: bool = True
    ):
        """
        Initialize LightOn RAG pipeline.
        
        Args:
            ocr_model: LightOnOCR model identifier
            embedding_model: Sentence transformer model
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
            use_embedded_db: Use embedded vector database
        """
        self.ocr_processor = LightOnOCRProcessor(ocr_model)
        self.text_chunker = TextChunker(chunk_size, chunk_overlap)
        self.embedding_generator = EmbeddingGenerator(embedding_model)
        self.vector_db = VectorDatabaseManager(use_embedded_db)
        
        self.collection_name = "lighton_ocr_chunks"
        self.vector_db.create_collection(
            self.collection_name,
            self.embedding_generator.embedding_dim
        )
    
    def process_document(
        self,
        image_path: str,
        document_id: Optional[str] = None
    ) -> LightOnPipelineResult:
        """
        Process a document through the complete RAG pipeline.
        
        Args:
            image_path: Path to document image
            document_id: Optional document identifier
            
        Returns:
            LightOnPipelineResult with all pipeline outputs
        """
        pipeline_start = time.time()
        
        if document_id is None:
            document_id = hashlib.md5(image_path.encode()).hexdigest()[:8]
        
        logger.info(f"Processing document: {document_id}")
        
        # Step 1: OCR
        logger.info("Step 1: OCR processing")
        ocr_result = self.ocr_processor.process_image(image_path)
        logger.info(f"OCR extracted {len(ocr_result.text)} characters")
        
        # Step 2: Chunking
        logger.info("Step 2: Text chunking")
        chunk_result = self.text_chunker.chunk_text(ocr_result.text)
        logger.info(f"Created {chunk_result.chunk_count} chunks")
        
        # Step 3: Embedding
        logger.info("Step 3: Generating embeddings")
        embedding_result = self.embedding_generator.embed_chunks(chunk_result.chunks)
        logger.info(f"Generated {len(embedding_result.embeddings)} embeddings")
        
        # Step 4: Store in vector database
        logger.info("Step 4: Storing in vector database")
        self.vector_db.add_chunks(
            self.collection_name,
            chunk_result.chunks,
            embedding_result.embeddings,
            document_id
        )
        
        total_time_ms = (time.time() - pipeline_start) * 1000
        
        # Create placeholder retrieval result (will be populated during query)
        retrieval_result = RetrievalResult(
            retrieved_chunks=[],
            retrieval_scores=[],
            retrieval_time_ms=0,
            chunks_retrieved=0
        )
        
        return LightOnPipelineResult(
            ocr_result=ocr_result,
            chunk_result=chunk_result,
            embedding_result=embedding_result,
            retrieval_result=retrieval_result,
            total_time_ms=total_time_ms,
            total_tokens=embedding_result.total_tokens,
            pipeline_id=document_id
        )
    
    def query(
        self,
        query_text: str,
        top_k: int = 5
    ) -> Tuple[List[str], List[float]]:
        """
        Query the vector database for relevant chunks.
        
        Args:
            query_text: Query text
            top_k: Number of chunks to retrieve
            
        Returns:
            Tuple of (retrieved_chunks, retrieval_scores)
        """
        logger.info(f"Querying: {query_text}")
        
        # Generate query embedding
        query_embedding = self.embedding_generator.model.encode(
            query_text,
            convert_to_numpy=True
        )
        
        # Retrieve chunks
        retrieval_result = self.vector_db.retrieve_chunks(
            self.collection_name,
            query_embedding,
            top_k
        )
        
        logger.info(f"Retrieved {len(retrieval_result.retrieved_chunks)} chunks")
        
        return retrieval_result.retrieved_chunks, retrieval_result.retrieval_scores


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Initialize pipeline
    pipeline = LightOnRAGPipeline()
    
    # Process a document
    # result = pipeline.process_document("path/to/image.jpg")
    # print(f"Pipeline completed in {result.total_time_ms:.2f}ms")
    # print(f"Total tokens: {result.total_tokens}")
    
    # Query the database
    # chunks, scores = pipeline.query("What is the main topic?")
    # for chunk, score in zip(chunks, scores):
    #     print(f"Score: {score:.4f} - {chunk[:100]}...")

