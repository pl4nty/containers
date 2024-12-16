FROM python:3.9-slim

# Install necessary dependencies
RUN pip install fastapi uvicorn requests

# Copy the Python project files into the container
COPY . /app

# Set the working directory
WORKDIR /app

# Set the entry point to run the web API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
