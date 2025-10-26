from transformers import AutoModelForCausalLM, AutoTokenizer
from deepseek_ocr_preprocessing import DeepSeekOCRPreprocessor
import os
import torch

class GPTDeepSeekOCRWrapper:
    def __init__(self, model_name: str = "gpt2"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        self.preprocessor = DeepSeekOCRPreprocessor()

        # Set pad_token_id for GPT2 if not already set, needed for batch generation
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
            self.model.config.pad_token_id = self.model.config.eos_token_id

    def generate_content_with_ocr(self, text_input: str, image_file_path: str, prompt: str = "", max_new_tokens: int = 100):
        """
        Generates content using a GPT-like model, leveraging DeepSeek-OCR for vision-text compression.
        The image_file_path is processed by DeepSeek-OCR, and its output is combined with the text_input and prompt for the GPT model.
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

        # Assuming deepseek_ocr_output contains the extracted text or a representation the GPT model can understand.
        # For now, we'll assume deepseek_ocr_output is the directly extracted text or a string representation.
        # If deepseek_ocr_output is a complex object, it needs to be converted to a string or appropriate format
        # for the GPT model's input.
        
        # 2. Prepare content for the GPT model
        # Combine the original text_input, the OCR'd text, and the user prompt for the GPT model.
        combined_text = ""
        if text_input:
            combined_text += text_input + "\n"
        if deepseek_ocr_output:
            # Assuming deepseek_ocr_output is a string containing the OCR'd text.
            combined_text += str(deepseek_ocr_output) + "\n"
        if prompt and prompt != text_input: # Avoid duplicating prompt if it was already used as text_input
            combined_text += prompt + "\n"

        print(f"[GPT] Sending content to GPT model: {combined_text}")
        
        # Tokenize the combined input
        inputs = self.tokenizer(combined_text, return_tensors="pt", padding=True, truncation=True)
        
        # Generate content
        with torch.no_grad():
            output_tokens = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                num_return_sequences=1,
                do_sample=True,
                temperature=0.7,
                top_p=0.9
            )
        
        # Decode the generated tokens
        generated_text = self.tokenizer.decode(output_tokens[0], skip_special_tokens=True)
        
        # Remove the input text from the generated text to get only the model's response
        response_text = generated_text[len(self.tokenizer.decode(inputs['input_ids'][0], skip_special_tokens=True)):]
        
        return response_text.strip()

# Example Usage (for testing purposes)
if __name__ == "__main__":
    # You would need to install transformers and torch
    # pip install transformers torch

    gpt_wrapper = GPTDeepSeekOCRWrapper()

    # Assume a dummy image file for testing
    dummy_image_path = "./DeepSeek-OCR/assets/demo.jpg" 

    if os.path.exists(dummy_image_path):
        try:
            print("\n--- Testing GPT integration with DeepSeek-OCR ---")
            user_text_input = "Based on the document, what is the main topic?"
            user_prompt = "Analyze the content and provide a concise summary."

            gpt_response = gpt_wrapper.generate_content_with_ocr(
                text_input=user_text_input,
                image_file_path=dummy_image_path,
                prompt=user_prompt
            )
            print("\n[GPT Response]:")
            print(gpt_response)
        except Exception as e:
            print(f"An error occurred during GPT integration: {e}")
    else:
        print(f"Dummy image not found at {dummy_image_path}. Please ensure the DeepSeek-OCR repository is cloned and the image exists.")

