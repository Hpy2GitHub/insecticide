#!/usr/bin/bash

# 1. Automatically find the base SVG file (e.g., icon48.svg)
# This looks for any .svg file that ISN'T an "-active" version
SOURCE_SVG=$(ls *.svg | grep -v -- "-active" | head -n 1)

if [ -z "$SOURCE_SVG" ]; then
    echo "Error: No source SVG file found in this directory!"
    exit 1
fi

# 2. Strip the .svg extension to get the base name (e.g., "icon48")
INPUT_BASE="${SOURCE_SVG%.*}"

SIZES=(16 32 48 128)
TYPES=("$INPUT_BASE" "${INPUT_BASE}-active")

echo "Found source: $SOURCE_SVG. Using base name: $INPUT_BASE"

for TYPE in "${TYPES[@]}"
do
    if [ -f "$TYPE.svg" ]; then
        echo "Processing: $TYPE.svg"
        for SIZE in "${SIZES[@]}"
        do
            # Places the size between the name and extension (e.g., icon48-16.png)
            # This makes it much easier to read in your manifest.json
            echo "  -> Generating ${TYPE}-${SIZE}.png..."
            convert -background none -size "${SIZE}x${SIZE}" "$TYPE.svg" "${TYPE}-${SIZE}.png"
        done
    else
        echo "Skipping $TYPE.svg (Optional active state file not found)"
    fi
done

echo "Done! Icons generated using $SOURCE_SVG as the template."
