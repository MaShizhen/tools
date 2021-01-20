#! /bin/bash
# vsce package
# major, minor, or patch
vsce publish --yarn minor && git push
