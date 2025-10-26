import os
from deepseek_ocr.gemini_wrapper import GeminiDeepSeekOCRWrapper

# Get the Gemini API key from the environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Please set the GEMINI_API_KEY environment variable.")
    exit()

# Create a GeminiDeepSeekOCRWrapper instance
gemini_wrapper = GeminiDeepSeekOCRWrapper(api_key=GEMINI_API_KEY)

# Path to the image file
image_path = "path/to/your/image.jpg"

if os.path.exists(image_path):
    try:
        # Generate content with OCR
        response = gemini_wrapper.generate_content_with_ocr(
            text_input="Summarize the document.",
            image_file_path=image_path,
            prompt="What are the main points?"
        )
        print("Gemini Response:")
        print(response)
    except Exception as e:
        print(f"An error occurred: {e}")
else:
    print(f"Image file not found at: {image_path}")
