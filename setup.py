from setuptools import setup, find_packages

setup(
    name='deepseek_ocr',
    version='0.1.0',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        'google-generativeai',
        'transformers',
        'torch',
        'torchvision',
        'torchaudio',
        'vllm==0.8.5',
    ],
    author='Your Name',
    author_email='your.email@example.com',
    description='A project to integrate DeepSeek-OCR with LLMs like Gemini and GPT.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/yourusername/deepseek-ocr',
)
