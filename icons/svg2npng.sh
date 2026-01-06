#!/usr/bin/bash

# Default to "icon48" if no argument is provided
INPUT_BASE=${1:-"icon48"}

# Array of sizes needed for the manifest
SIZES=(16 32 48 128)

# We define the two types of icons we want to generate
TYPES=("$INPUT_BASE" "${INPUT_BASE}-active")

for TYPE in "${TYPES[@]}"
do
    # Check if the source SVG exists before trying to convert
    if [ -f "$TYPE.svg" ]; then
        echo "Processing source: $TYPE.svg"
        for SIZE in "${SIZES[@]}"
        do
            echo "  -> Generating ${TYPE}${SIZE}.png..."
            convert -background none -size "${SIZE}x${SIZE}" "$TYPE.svg" "${TYPE}${SIZE}.png"
        done
    else
        echo "Skipping $TYPE.svg (file not found)"
    fi
done

echo "Done!"
