.PHONY: all setup local vm docker-ready docker-build docker-run clean dev

# Default: setup and run locally
all: setup vm

# Create virtualenv and install all dependencies (dev + main)
setup:
	bash setup.sh

# Launch the Streamlit chat locally
local:
	.venv/bin/streamlit run computer_use_demo/streamlit.py

# Start the headless Linux desktop + VNC + noVNC + Streamlit via Docker
vm: docker-build docker-run

# Ensure Docker daemon is running (macOS: auto-starts Docker Desktop)
docker-ready:
	@echo "Checking if Docker daemon is running..."
	@if ! docker info >/dev/null 2>&1; then \
	  echo "Docker daemon not reachable. Attempting to start Docker Desktop..."; \
	  open --background -a Docker || true; \
	  echo "Waiting for Docker to become available..."; \
	  until docker info >/dev/null 2>&1; do \
	    sleep 2; \
	  done; \
	  echo "Docker is now running."; \
	fi

# Build the Docker image with buildx for amd64
docker-build: docker-ready
	docker buildx build --platform linux/amd64 --load -t computer-use-demo .

# Run the Docker container with required ports forwarded
docker-run:
	@echo "Stopping existing container 'computer-use-demo' if present"
	-docker stop computer-use-demo || true
	@echo "Freeing host ports 8080, 8501 and 6080 if in use"
	-@pids=$$(lsof -ti tcp:8080); [ -n "$$pids" ] && kill $$pids
	-@pids=$$(lsof -ti tcp:8501); [ -n "$$pids" ] && kill $$pids
	-@pids=$$(lsof -ti tcp:6080); [ -n "$$pids" ] && kill $$pids
	@if ! docker ps -a --format '{{.Names}}' | grep -q '^computer-use-demo$$'; then \
	  echo "Launching new Docker container"; \
	  docker run --platform linux/amd64 --shm-size 2g --name computer-use-demo -d \
	    -p 8080:8080 \
	    -p 8501:8501 \
	    -p 6080:6080 \
	    -e DISPLAY_NUM=1 -e WIDTH=1920 -e HEIGHT=1080 \
	    -v computer-use-demo-home:/home/computeruse \
	    computer-use-demo; \
	else \
	  echo "Starting existing Docker container"; \
	  docker start computer-use-demo; \
	fi

# Cleanup the virtual environment
clean:
	rm -rf .venv

# Run container with live-mounted source so edits are reflected instantly
dev: docker-ready docker-build
	@echo "Stopping existing dev container if image rebuilt"
	-docker stop computer-use-demo-dev >/dev/null 2>&1 || true
	@echo "Freeing host ports 8080, 8501 and 6080 if in use"
	-@pids=$$(lsof -ti tcp:8080); [ -n "$$pids" ] && kill $$pids
	-@pids=$$(lsof -ti tcp:8501); [ -n "$$pids" ] && kill $$pids
	-@pids=$$(lsof -ti tcp:6080); [ -n "$$pids" ] && kill $$pids
	@if ! docker ps -a --format '{{.Names}}' | grep -q '^computer-use-demo-dev$$'; then \
	  echo "Launching new dev container (with volume mount)"; \
	  docker run --platform linux/amd64 --shm-size 2g --name computer-use-demo-dev -d \
	    -p 8080:8080 -p 8501:8501 -p 6080:6080 \
	    -e DISPLAY_NUM=1 -e WIDTH=1920 -e HEIGHT=1080 \
	    -v computer-use-demo-home:/home/computeruse \
	    -v $(PWD)/computer_use_demo:/home/computeruse/computer_use_demo \
	    computer-use-demo; \
	else \
	  echo "Starting existing dev container"; \
	  docker start computer-use-demo-dev; \
	fi 