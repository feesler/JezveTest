#!/bin/bash

git checkout release --
git merge --no-ff -m "Version $1" master
git tag -a v.$1 -m "Version $1"
git checkout master --
