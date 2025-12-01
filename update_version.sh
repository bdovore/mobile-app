#!/bin/bash

# This script updates the version number accross the different files of the project

shopt -s lastpipe
cat app.json | grep version | sed 's/\"version\"\: \"\([0-9\.]*\)\",/\1/g' | read version

cat ios/bdovore.xcodeproj/project.pbxproj | grep CURRENT_PROJECT_VERSION | sed 's/CURRENT\_PROJECT\_VERSION = \([0-9]*\);/\1/g' | read projectVersion
cat android/app/build.gradle | grep versionCode | sed 's/        versionCode \([0-9]*\)/\1/g' | read versionCode
echo Current version: $version
echo Current Android versionCode: $versionCode
echo Current iOS projectVersion: $projectVersion

echo Enter the new version number:
read version

((projectVersion+=1))
((versionCode+=1))

sed -i "s/\"version\"\: \"[0-9\.]*\"/\"version\": \"$version\"/g" app.json
sed -i "s/\"version\"\: \"[0-9\.]*\"/\"version\": \"$version\"/g" package.json

sed -i "s/        versionCode [0-9]*/        versionCode $versionCode/g" android/app/build.gradle
sed -i "s/        versionName \"[0-9\.]*\"/        versionName \"$version\"/g" android/app/build.gradle

sed -i "s/CURRENT_PROJECT_VERSION = [0-9]*/CURRENT_PROJECT_VERSION = $projectVersion/g" ios/bdovore.xcodeproj/project.pbxproj
sed -i "s/MARKETING_VERSION = [0-9\.]*/MARKETING_VERSION = $version/g" ios/bdovore.xcodeproj/project.pbxproj


sed -i "s/APP_VERSION=[0-9\.]*/APP_VERSION=$version/g" android/make.bat
sed -i "s/APP_VERSION=[0-9\.]*/APP_VERSION=$version/g" android/make

sed -i "s/bdovore-v[0-9\.]*-/bdovore-v$version-/g" android/make.bat
sed -i "s/bdovore-v[0-9\.]*-/bdovore-v$version-/g" android/make

echo New version: $version
echo New Android versionCode: $versionCode
echo New iOS projectVersion: $projectVersion
echo Done.
