#!/usr/bin/bash

# If you pass "icon", it looks for "icon.svg" and "icon-active.svg"
INPUT_BASE=${1:-"icon"}

SIZES=(16 32 48 128)
TYPES=("$INPUT_BASE" "${INPUT_BASE}-active")

for TYPE in "${TYPES[@]}"
do
    if [ -f "$TYPE.svg" ]; then
        echo "Processing source: $TYPE.svg"
        for SIZE in "${SIZES[@]}"
        do
            # Improved Logic: 
            # 1. Define background/size BEFORE the SVG for high quality
            # 2. Cleaned up naming (e.g., icon16.png instead of icon4816.png)
            echo "  -> Generating ${TYPE}${SIZE}.png..."
            convert -background none -size "${SIZE}x${SIZE}" "$TYPE.svg" "${TYPE}${SIZE}.png"
        done
    else
        echo "Skipping $TYPE.svg (file not found)"
    fi
done

echo "Done!"
