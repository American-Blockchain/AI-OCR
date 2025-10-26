import google.generativeai as genai
from deepseek_ocr_preprocessing import DeepSeekOCRPreprocessor
import os

class GeminiDeepSeekOCRWrapper:
    def __init__(self, api_key: str, model_name: str = "gemini-pro-vision"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.preprocessor = DeepSeekOCRPreprocessor()

    def generate_content_with_ocr(self, text_input: str, image_file_path: str, prompt: str = ""):
        """
        Generates content using Gemini, leveraging DeepSeek-OCR for vision-text compression.
        The image_file_path is processed by DeepSeek-OCR, and its output is combined with the text_input and prompt for Gemini.
        """
        if not os.path.exists(image_file_path):
            raise FileNotFoundError(f"Image file not found at: {image_file_path}")

        # 1. Preprocess the image using DeepSeek-OCR
        print(f"[DeepSeek-OCR] Preprocessing image: {image_file_path}")
        deepseek_ocr_output = self.preprocessor.preprocess_text_to_vision_tokens(
            text_input=prompt, # Use the prompt as text input for DeepSeek-OCR if it's an instruction
            image_file=image_file_path,
            output_path="./deepseek_ocr_output"
        )
        print(f"[DeepSeek-OCR] Preprocessing complete. Output: {deepseek_ocr_output}")

        # Assuming deepseek_ocr_output contains the extracted text or a representation Gemini can understand
        # For now, we'll assume deepseek_ocr_output is the directly extracted text or a string representation
        # If deepseek_ocr_output is a complex object, it needs to be converted to a string or appropriate format
        # for Gemini's input.
        
        # 2. Prepare content for Gemini
        # Gemini-Pro-Vision accepts a list of parts, which can be text or image objects.
        # If DeepSeek-OCR output is text, combine it with the original text_input and prompt.
        
        # For now, let's assume deepseek_ocr_output is a string containing the OCR'd text.
        # In a real scenario, we might need to parse `deepseek_ocr_output` to get the actual text.
        
        # Combine the original text_input, the OCR'd text, and the user prompt for Gemini.
        combined_content = []
        if text_input:
            combined_content.append(text_input)
        if deepseek_ocr_output:
            # Assuming deepseek_ocr_output is a string or has a __str__ method that returns relevant text
            combined_content.append(str(deepseek_ocr_output))
        if prompt and prompt != text_input: # Avoid duplicating prompt if it was already used as text_input
            combined_content.append(prompt)

        # If the model is gemini-pro-vision, it can also take image parts directly.
        # However, the goal of DeepSeek-OCR is to compress the *textual content* of the image into tokens,
        # so the direct image input to Gemini might bypass the compression benefit.
        # For this integration, we're focusing on passing the *output of DeepSeek-OCR* to Gemini.

        print(f"[Gemini] Sending content to Gemini: {combined_content}")
        response = self.model.generate_content(combined_content)
        return response.text

# Example Usage (for testing purposes)
if __name__ == "__main__":
    # !!! IMPORTANT: Replace with your actual Gemini API key !!!
    # It's recommended to load API keys from environment variables or a secure configuration.
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
    if not GEMINI_API_KEY:
        print("Please set the GEMINI_API_KEY environment variable.")
        exit()

    gemini_wrapper = GeminiDeepSeekOCRWrapper(api_key=GEMINI_API_KEY)

    # Assume a dummy image file for testing
    dummy_image_path = "./DeepSeek-OCR/assets/demo.jpg" 

    if os.path.exists(dummy_image_path):
        try:
            print("\n--- Testing Gemini integration with DeepSeek-OCR ---")
            user_text_input = "Please summarize the key information from this document."
            user_prompt = "What are the main points mentioned in the document?"

            gemini_response = gemini_wrapper.generate_content_with_ocr(
                text_input=user_text_input,
                image_file_path=dummy_image_path,
                prompt=user_prompt
            )
            print("\n[Gemini Response]:")
            print(gemini_response)
        except Exception as e:
            print(f"An error occurred during Gemini integration: {e}")
    else:
        print(f"Dummy image not found at {dummy_image_path}. Please ensure the DeepSeek-OCR repository is cloned and the image exists.")

