# Build and run the test container
# Usage: ./run-local-test.sh

echo "Building test container..."
docker build -f Dockerfile.test -t item-refresher-test .

echo ""
echo "Running test..."
docker run --rm --env-file ../.env.test item-refresher-test
