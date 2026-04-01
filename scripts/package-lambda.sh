#!/bin/sh

set -eu

LAMBDA_DIR_NAME="$1"
BUILD_DIR="dist/lambda-build"
ZIP_PATH="dist/$LAMBDA_DIR_NAME.zip"

rm -rf "$BUILD_DIR" "$ZIP_PATH"

# Copy compiled lambda files into a subdirectory matching the source layout,
# so that ../shared/ imports resolve correctly inside the zip.
mkdir -p "$BUILD_DIR/$LAMBDA_DIR_NAME"
cp "dist/lambda-ts/$LAMBDA_DIR_NAME/"*.js "$BUILD_DIR/$LAMBDA_DIR_NAME/"

mkdir -p "$BUILD_DIR/shared"
cp dist/lambda-ts/shared/*.js "$BUILD_DIR/shared/"

# Required so the Lambda runtime treats the .js files as ESM.
echo '{"type":"module"}' > "$BUILD_DIR/package.json"

if [ "$#" -gt 1 ]; then
  mkdir -p "$BUILD_DIR/node_modules"
  shift
  for dependency in "$@"; do
    cp -R "node_modules/$dependency" "$BUILD_DIR/node_modules/$dependency"
  done
fi

cd "$BUILD_DIR"
zip -r "../$LAMBDA_DIR_NAME.zip" .
