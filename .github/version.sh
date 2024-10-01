# Find the current version of the @conform-to/dom package
VERSION=$(node -p "require('./packages/conform-dom/package.json').version")

# Create a tmp file with the version replaced
sed "s/^Version [0-9]*\.[0-9]*\.[0-9]*/Version ${VERSION}/" ./README.md > ./README.tmp

# Replace the original file with the updated file
mv ./README.tmp ./README.md

