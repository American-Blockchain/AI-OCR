# Project Overview

This project integrates DeepSeek-OCR with Large Language Models (LLMs) like Gemini and GPT. It leverages DeepSeek-OCR's vision-text compression to extend the context window of LLMs, enabling them to process longer documents more efficiently.

The core of the project lies in a preprocessing step that converts text and images into a compressed format using DeepSeek-OCR. Wrapper classes are then used to send this compressed data to the Gemini and GPT APIs for processing.

## Building and Running

### 1. Installation

To set up the project, you need to install the required dependencies.

```bash
pip install -r requirements.txt
```

This will install the necessary Python libraries, including `google-generativeai`, `transformers`, and `torch`.

### 2. Gemini API Key

For the Gemini integration, you need to set your Gemini API key as an environment variable.

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
```

### 3. Running the Wrappers

You can run the integration wrappers directly to test the functionality.

**Gemini:**

```bash
python gemini_integration_wrapper.py
```

**GPT:**

```bash
python gpt_integration_wrapper.py
```

These scripts will process a demo image using DeepSeek-OCR and then send the processed output to the respective LLM for summarization.

## Development Conventions

*   **Code Style:** The project follows standard Python coding conventions (PEP 8).
*   **Modularity:** The code is organized into modules with specific responsibilities:
    *   `deepseek_ocr_preprocessing.py`: Handles all interactions with the DeepSeek-OCR model.
    *   `gemini_integration_wrapper.py`: Provides a high-level wrapper for the Gemini API.
    *   `gpt_integration_wrapper.py`: Provides a high-level wrapper for GPT models.
*   **Configuration:** API keys and other sensitive information should be managed through environment variables rather than being hardcoded in the source.
