#!/usr/bin/bash
files="README.md background.js content.js icons/icon48-active.svg icons/icon48.svg icons/svg2npng.sh manifest.json styles.css"
>$rhd/project-contents.txt
for i in $files
do
	echo "=================="
	echo " FILE: $i"
	echo "=================="
	cat $i
done >$rhd/project-contents.txt

cd icons
echo "==================" >> $rhd/project-contents.txt
echo " PWD: $(pwd)" >> $rhd/project-contents.txt
echo "==================" >> $rhd/project-contents.txt
ls -1 * >>$rhd/project-contents.txt

