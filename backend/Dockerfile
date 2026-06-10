FROM golang:1.25-alpine AS builder

WORKDIR /app

# Enable go modules
ENV GO111MODULE=on \
    GOPROXY=https://goproxy.cn,direct

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies.
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# Use a minimal alpine image for the final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/server .


# Expose port (WeChat Cloud Run usually uses 80)
EXPOSE 80

# Set environment variable
ENV PORT=80

# Command to run the executable
CMD ["./server"]
