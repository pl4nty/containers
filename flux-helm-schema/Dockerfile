FROM python:3.14-slim@sha256:a2b82f3c48559aa0a8446d9af49826b6e2b2016f4cd2afabfe6013ec53729170

# Install necessary dependencies
RUN pip install fastapi uvicorn requests

# Copy the Python project files into the container
COPY . /app

# Set the working directory
WORKDIR /app

# Set the entry point to run the web API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
