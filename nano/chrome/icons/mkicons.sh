#!/usr/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ERROR: ImageMagick 'convert' command not found!"
    echo "Install it with: sudo apt install imagemagick"
    exit 1
fi

# Find source PNG (prefer larger sizes for better quality)
SOURCE_PNG=$(find . -maxdepth 1 -name "*.png" -type f 2>/dev/null | \
    grep -v -- "-active" | \
    sort -V | tail -n 1)  # Get largest numbered PNG or last alphabetically

if [ -z "$SOURCE_PNG" ]; then
    echo "Error: No source PNG file found in this directory!"
    exit 1
fi

# Check if source PNG is large enough (at least 128px for decent quality)
SOURCE_SIZE=$(identify -format "%wx%h" "$SOURCE_PNG" 2>/dev/null | cut -dx -f1)
if [ -n "$SOURCE_SIZE" ] && [ "$SOURCE_SIZE" -lt 128 ]; then
    echo "Warning: Source PNG is only ${SOURCE_SIZE}px. For best results, use at least 128x128px."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

OUTPUT_BASE="icon"
INPUT_BASE="${SOURCE_PNG%.*}"
SIZES=(16 32 48 128)

echo "Found source: $SOURCE_PNG (${SOURCE_SIZE}x${SOURCE_SIZE})"
echo "Output prefix: $OUTPUT_BASE"
echo ""

# Process standard icon
echo "Processing: $SOURCE_PNG"
for SIZE in "${SIZES[@]}"
do
    OUTPUT_FILE="${OUTPUT_BASE}${SIZE}.png"
    echo -n "  Generating ${OUTPUT_FILE}... "
    
    # For PNG resizing, use high-quality resize with alpha channel preserved
    convert -resize "${SIZE}x${SIZE}" \
            -quality 95 \
            -strip \
            -unsharp 0.5x0.5+0.5+0.008 \
            "$SOURCE_PNG" "$OUTPUT_FILE"
    
    if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
        FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
        DIMENSIONS=$(identify -format "%wx%h" "$OUTPUT_FILE" 2>/dev/null)
        if [ "$FILE_SIZE" -gt 100 ]; then
            echo "✓ ${DIMENSIONS} ($FILE_SIZE bytes)"
        else
            echo "✗ (file too small: $FILE_SIZE bytes)"
        fi
    else
        echo "✗ (failed to create)"
    fi
done

# Process active icon
ACTIVE_PNG="${INPUT_BASE}-active.png"
if [ -f "$ACTIVE_PNG" ]; then
    echo ""
    echo "Processing: $ACTIVE_PNG"
    for SIZE in "${SIZES[@]}"
    do
        OUTPUT_FILE="${OUTPUT_BASE}-active-${SIZE}.png"
        echo -n "  Generating ${OUTPUT_FILE}... "
        
        convert -resize "${SIZE}x${SIZE}" \
                -quality 95 \
                -strip \
                -unsharp 0.5x0.5+0.5+0.008 \
                "$ACTIVE_PNG" "$OUTPUT_FILE"
        
        if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
            DIMENSIONS=$(identify -format "%wx%h" "$OUTPUT_FILE" 2>/dev/null)
            if [ "$FILE_SIZE" -gt 100 ]; then
                echo "✓ ${DIMENSIONS} ($FILE_SIZE bytes)"
            else
                echo "✗ (file too small: $FILE_SIZE bytes)"
            fi
        else
            echo "✗ (failed to create)"
        fi
    done
else
    # Also check for common active icon patterns
    ALTERNATIVE_ACTIVE_PATTERNS=(
        "${INPUT_BASE}_active.png"
        "${INPUT_BASE}-hover.png"
        "${INPUT_BASE}_hover.png"
        "active-${INPUT_BASE##*/}.png"
    )
    
    ACTIVE_FOUND=""
    for pattern in "${ALTERNATIVE_ACTIVE_PATTERNS[@]}"; do
        if [ -f "$pattern" ]; then
            ACTIVE_PNG="$pattern"
            ACTIVE_FOUND="yes"
            break
        fi
    done
    
    if [ -n "$ACTIVE_FOUND" ]; then
        echo ""
        echo "Processing active icon: $ACTIVE_PNG"
        for SIZE in "${SIZES[@]}"
        do
            OUTPUT_FILE="${OUTPUT_BASE}-active-${SIZE}.png"
            echo -n "  Generating ${OUTPUT_FILE}... "
            
            convert -resize "${SIZE}x${SIZE}" \
                    -quality 95 \
                    -strip \
                    -unsharp 0.5x0.5+0.5+0.008 \
                    "$ACTIVE_PNG" "$OUTPUT_FILE"
            
            if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
                FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
                DIMENSIONS=$(identify -format "%wx%h" "$OUTPUT_FILE" 2>/dev/null)
                if [ "$FILE_SIZE" -gt 100 ]; then
                    echo "✓ ${DIMENSIONS} ($FILE_SIZE bytes)"
                else
                    echo "✗ (file too small: $FILE_SIZE bytes)"
                fi
            else
                echo "✗ (failed to create)"
            fi
        done
    else
        echo ""
        echo "Skipping active icons (no active variant found)"
        echo "  Checked for: ${INPUT_BASE}-active.png, ${INPUT_BASE}_active.png, etc."
    fi
fi

echo ""
echo "Done! Files generated:"
ls -lh ${OUTPUT_BASE}*.png 2>/dev/null || echo "No files were generated!"

# Optional: Create manifest-ready icon list
echo ""
echo "For Chrome extension manifest.json, use:"
echo '  "icons": {'
for SIZE in "${SIZES[@]}"; do
    if [ -f "${OUTPUT_BASE}${SIZE}.png" ]; then
        echo "    \"$SIZE\": \"icons/icon${SIZE}.png\","
    fi
done | sed '$ s/,$//'  # Remove comma from last line
echo '  }'
