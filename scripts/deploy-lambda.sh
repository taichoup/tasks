#!/bin/sh

set -eu

FUNCTION_NAME="$1"
ZIP_PATH="$2"
AWS_REGION="${AWS_REGION:-eu-north-1}"

aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_PATH" \
  --region "$AWS_REGION"
