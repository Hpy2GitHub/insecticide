#!/bin/bash

# Define the output filename
FILENAME="insecticide-v1.zip"

# Remove old zip if it exists
rm -f $FILENAME

# Create the zip
# "." includes everything in the current folder
# -r makes it recursive
# -x defines the files/folders to exclude
zip -r $FILENAME . -x \
    "*.git*" \
    "node_modules/*" \
    ".DS_Store" \
    "*.zip" \
    ".vscode/*" \
    "src/unused/*" \
    "bak/*" \
    "icons/bak/*" \
    "icons/*.sh" \
    "*.sh" \
    "*.svg" \
    "README.md"

cp $FILENAME $rhd/.

echo "Build complete: $FILENAME"
