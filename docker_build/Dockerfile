# Stage 1: Build stage
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt /app/requirements.txt
RUN echo "fastapi" >> /app/requirements.txt && \
    echo "uvicorn[standard]" >> /app/requirements.txt && \
    echo "pydantic" >> /app/requirements.txt && \
    pip install --upgrade pip && \
    pip wheel --no-cache-dir --wheel-dir=/app/wheels -r requirements.txt

# Stage 2: Production stage
FROM python:3.11-slim

# Create a non-root user
RUN useradd --create-home appuser
WORKDIR /home/appuser

# Copy installed packages from builder stage
COPY --from=builder /app/wheels /wheels
RUN pip install --no-index --find-links=/wheels /wheels/* && \
    rm -rf /wheels

# Copy the application code
COPY . /home/appuser/app
WORKDIR /home/appuser/app

# Change ownership of the app directory
RUN chown -R appuser:appuser /home/appuser

# Switch to the non-root user
USER appuser

# Expose the port the application runs on
EXPOSE 8000

# Command to run the application using Gunicorn for production
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "src.main:app", "--bind", "0.0.0.0:8000"]
