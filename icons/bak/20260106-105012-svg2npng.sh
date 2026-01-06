#!/usr/bin/bash

# The base name of your SVG (e.g., 'icon48-active' or just 'icon')
INPUT_NAME=$1

if [ "$INPUT_NAME" == "" ]
then
	INPUT_NAME="icon48"
fi

# Array of sizes needed for the manifest
SIZES=(16 32 48 128)

for SIZE in "${SIZES[@]}"
do
    echo "Generating icon${SIZE}.png..."
    convert -background none -size "${SIZE}x${SIZE}" "$INPUT_NAME.svg" "icon${SIZE}.png"
done

echo "Done!"
