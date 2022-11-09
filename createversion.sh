#!/bin/bash

if [[ -z "$1" ]]; then
    echo "No version specified"
    exit 1
fi

git checkout release --
git pull -v --no-rebase "origin"
git merge --no-ff -m "Version $1" master
git tag -a v.$1 -m "Version $1"
git checkout master --
