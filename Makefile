.PHONY: install start dev test check clean deploy docker-build docker-run

# Default target
all: install check

# Install dependencies
install:
	npm install

# Check system requirements
check:
	node check-requirements.js

# Start production server
start:
	npm start

# Start development server
dev:
	npm run dev

# Run tests
test:
	node test.js

# Clean downloads folder
clean:
	rm -rf downloads/*
	@echo "✅ Downloads folder cleaned"

# Deploy with PM2
deploy:
	pm2 start ecosystem.config.js

# Docker commands
docker-build:
	docker build -t youtube-downloader .

docker-run:
	docker run -d -p 3000:3000 -v $(PWD)/downloads:/usr/src/app/downloads --name youtube-downloader youtube-downloader

docker-compose-up:
	docker-compose up -d --build

docker-compose-down:
	docker-compose down

# View logs
logs:
	tail -f logs/combined.log

# Help
help:
	@echo "Available targets:"
	@echo "  install          - Install npm dependencies"
	@echo "  check            - Check system requirements"
	@echo "  start            - Start production server"
	@echo "  dev              - Start development server"
	@echo "  test             - Run API tests"
	@echo "  clean            - Clean downloads folder"
	@echo "  deploy           - Deploy with PM2"
	@echo "  docker-build     - Build Docker image"
	@echo "  docker-run       - Run Docker container"
	@echo "  docker-compose-up - Start with Docker Compose"
	@echo "  logs             - View logs"
