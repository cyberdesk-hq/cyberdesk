# Use Python 3.12 as the base image
FROM python:3.12

# Set the working directory
WORKDIR /app

# Copy all files from the current directory to the container
COPY . .

# Install required packages
RUN pip install --no-cache-dir -r requirements.txt

# Run the Docker-specific controller
CMD ["python", "handlers/docker_controller.py"]