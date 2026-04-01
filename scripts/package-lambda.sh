#!/bin/sh

set -eu

LAMBDA_DIR_NAME="$1"
BUILD_DIR="dist/lambda-build"
ZIP_PATH="dist/$LAMBDA_DIR_NAME.zip"

rm -rf "$BUILD_DIR" "$ZIP_PATH"

# Copy lambda files into a subdirectory matching the source layout,
# so that ../shared/ imports resolve correctly inside the zip.
mkdir -p "$BUILD_DIR/$LAMBDA_DIR_NAME"
cp "backend/$LAMBDA_DIR_NAME/"*.mjs "$BUILD_DIR/$LAMBDA_DIR_NAME/"

mkdir -p "$BUILD_DIR/shared"
cp backend/shared/*.mjs "$BUILD_DIR/shared/"

if [ "$#" -gt 1 ]; then
  mkdir -p "$BUILD_DIR/node_modules"
  shift
  for dependency in "$@"; do
    cp -R "node_modules/$dependency" "$BUILD_DIR/node_modules/$dependency"
  done
fi

cd "$BUILD_DIR"
zip -r "../$LAMBDA_DIR_NAME.zip" .
