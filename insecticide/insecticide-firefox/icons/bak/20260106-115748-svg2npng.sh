#!/usr/bin/bash

# 1. Automatically find the base SVG file (e.g., icon48.svg)
SOURCE_SVG=$(ls *.svg 2>/dev/null | grep -v -- "-active" | head -n 1)

if [ -z "$SOURCE_SVG" ]; then
    echo "Error: No source SVG file found in this directory!"
    exit 1
fi

# 2. Hardcode the output base to "icon" as requested
OUTPUT_BASE="icon"
# Get the input base name for locating files (e.g., "icon48")
INPUT_BASE="${SOURCE_SVG%.*}"

SIZES=(16 32 48 128)

echo "Found source: $SOURCE_SVG. Output prefix will be: $OUTPUT_BASE"

# Process standard icon
echo "Processing: $SOURCE_SVG"
for SIZE in "${SIZES[@]}"
do
    echo "  -> Generating ${OUTPUT_BASE}${SIZE}.png..."
    convert -background none -size "${SIZE}x${SIZE}" "$SOURCE_SVG" "${OUTPUT_BASE}${SIZE}.png"
done

# Process active icon if it exists
ACTIVE_SVG="${INPUT_BASE}-active.svg"
if [ -f "$ACTIVE_SVG" ]; then
    echo "Processing: $ACTIVE_SVG"
    for SIZE in "${SIZES[@]}"
    do
        echo "  -> Generating ${OUTPUT_BASE}-active-${SIZE}.png..."
        convert -background none -size "${SIZE}x${SIZE}" "$ACTIVE_SVG" "${OUTPUT_BASE}-active-${SIZE}.png"
    done
else
    echo "Skipping active icons ($ACTIVE_SVG not found)"
fi

echo "Done!"
