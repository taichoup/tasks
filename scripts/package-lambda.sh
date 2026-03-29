#!/bin/sh

set -eu

LAMBDA_DIR_NAME="$1"
DIST_DIR="dist/$LAMBDA_DIR_NAME"
ZIP_PATH="dist/$LAMBDA_DIR_NAME.zip"

rm -rf "$DIST_DIR" "$ZIP_PATH"
mkdir -p "$DIST_DIR"
cp "backend/$LAMBDA_DIR_NAME/"*.mjs "$DIST_DIR/"

if [ "$#" -gt 1 ]; then
  mkdir -p "$DIST_DIR/node_modules"
  shift
  for dependency in "$@"; do
    cp -R "node_modules/$dependency" "$DIST_DIR/node_modules/$dependency"
  done
fi

cd "$DIST_DIR"
zip -r "../$LAMBDA_DIR_NAME.zip" .
