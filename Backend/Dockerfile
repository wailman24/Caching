FROM golang:1.25-alpine

RUN apk add --no-cache git bash

WORKDIR /app

# Install Air
RUN go install github.com/air-verse/air@latest

# Copy go.mod first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy everything
COPY . .

# Expose app port
EXPOSE 8080

# Run Air with config
CMD ["air", "-c", ".air.toml"]
