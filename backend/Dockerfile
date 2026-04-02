# Production-grade multi-runtime container (Node + Python)
FROM node:18-bullseye

# Install Python 3 and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY ml/requirements.txt ./ml/requirements.txt
RUN pip3 install --no-cache-dir -r ./ml/requirements.txt

# Copy and install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend files
COPY . .

# Expose the API port
EXPOSE 4000

# Explicitly use python3 for any script calls
ENV PYTHON_PATH=/usr/bin/python3
ENV NODE_ENV=production

# Start the server
CMD ["node", "index.js"]
