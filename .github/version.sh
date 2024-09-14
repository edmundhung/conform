# Find the current version of the @conform-to/dom package
VERSION=$(node -p "require('./packages/conform-dom/package.json').version")

# Replace the version on the README
sed -i '' "s/^Version [0-9]*\.[0-9]*\.[0-9]*/Version ${VERSION}/" ./README.md
