#!/bin/bash
set -e

# Change to your project directory
cd /Users/mat/Source/uk.thechels.themes.nnw

# Rename folders to temp names
mv Guro.nnwtheme GuroTemp.nnwtheme
mv Retro.nnwtheme RetroTemp.nnwtheme

git add .
git commit -m "Temp rename nnwtheme folders to force case change"

# Rename back to desired casing
mv GuroTemp.nnwtheme Guro.nnwtheme
mv RetroTemp.nnwtheme Retro.nnwtheme

git add .
git commit -m "Fix folder casing for nnwtheme folders"

# Push changes
git push