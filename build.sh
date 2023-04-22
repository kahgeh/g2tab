#!/usr/bin/env sh
tsc 
cp -r styles ./dist/
cp src/*.html ./dist/src/
cp manifest.json ./dist/
cp -r images ./dist/
