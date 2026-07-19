FROM python:3.14-slim@sha256:cea0e6040540fb2b965b6e7fb5ffa00871e632eef63719f0ea54bca189ce14a6

# Install necessary dependencies
RUN pip install fastapi uvicorn requests

# Copy the Python project files into the container
COPY . /app

# Set the working directory
WORKDIR /app

# Set the entry point to run the web API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
