#!/usr/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ERROR: ImageMagick 'convert' command not found!"
    echo "Install it with: sudo apt install imagemagick"
    exit 1
fi

# Find source SVG
SOURCE_SVG=$(ls *.svg 2>/dev/null | grep -v -- "-active" | head -n 1)

if [ -z "$SOURCE_SVG" ]; then
    echo "Error: No source SVG file found in this directory!"
    exit 1
fi

OUTPUT_BASE="icon"
INPUT_BASE="${SOURCE_SVG%.*}"
SIZES=(16 32 48 128)

echo "Found source: $SOURCE_SVG"
echo "Output prefix: $OUTPUT_BASE"
echo ""

# Process standard icon
echo "Processing: $SOURCE_SVG"
for SIZE in "${SIZES[@]}"
do
    OUTPUT_FILE="${OUTPUT_BASE}${SIZE}.png"
    echo -n "  Generating ${OUTPUT_FILE}... "
    
    convert -background none -resize "${SIZE}x${SIZE}" "$SOURCE_SVG" "$OUTPUT_FILE"
    
    if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
        FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
        if [ "$FILE_SIZE" -gt 100 ]; then
            echo "✓ ($FILE_SIZE bytes)"
        else
            echo "✗ (file too small: $FILE_SIZE bytes)"
        fi
    else
        echo "✗ (failed to create)"
    fi
done

# Process active icon
ACTIVE_SVG="${INPUT_BASE}-active.svg"
if [ -f "$ACTIVE_SVG" ]; then
    echo ""
    echo "Processing: $ACTIVE_SVG"
    for SIZE in "${SIZES[@]}"
    do
        OUTPUT_FILE="${OUTPUT_BASE}-active-${SIZE}.png"
        echo -n "  Generating ${OUTPUT_FILE}... "
        
        convert -background none -resize "${SIZE}x${SIZE}" "$ACTIVE_SVG" "$OUTPUT_FILE"
        
        if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
            if [ "$FILE_SIZE" -gt 100 ]; then
                echo "✓ ($FILE_SIZE bytes)"
            else
                echo "✗ (file too small: $FILE_SIZE bytes)"
            fi
        else
            echo "✗ (failed to create)"
        fi
    done
else
    echo ""
    echo "Skipping active icons ($ACTIVE_SVG not found)"
fi

echo ""
echo "Done! Verify all files:"
ls -lh ${OUTPUT_BASE}*.png
