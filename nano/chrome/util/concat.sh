#!/usr/bin/bash

>$rhd/project-contents.txt
file="README.md background.js content.js manifest.json popup.html popup.js sidepanel.html sidepanel.js"
for i in $file
do
	echo "=========================="
	echo " FILE: $i"
	echo "=========================="
 	cat $i
done >> $rhd/project-contents.txt
