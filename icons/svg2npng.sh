#!/usr/bin/bash
name=$1
convert -density 384 -background none $name.svg $name.png
