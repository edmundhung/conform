/* eslint-disable */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const v3Dir = path.join(rootDir, 'v3');
const v3v3Dir = path.join(rootDir, 'v3-v3');

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
	// Create destination directory
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

/**
 * Replace "zod" imports with "zod/v3" in TypeScript files
 */
function replaceZodImports(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			replaceZodImports(fullPath);
		} else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
			let content = fs.readFileSync(fullPath, 'utf8');

			// Replace imports and exports from "zod" to "zod/v3"
			// Handle: from 'zod'
			content = content.replace(/from ['"]zod['"]/g, "from 'zod/v3'");
			// Handle: import('zod')
			content = content.replace(/import\(['"]zod['"]\)/g, "import('zod/v3')");

			fs.writeFileSync(fullPath, content, 'utf8');
		}
	}
}

/**
 * Remove directory recursively
 */
function removeDir(dir) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

console.log('Starting prebuild process...');

// Copy v3 to v3-v3 and replace "zod" imports with "zod/v3"
console.log('Copying v3 to v3-v3...');
removeDir(v3v3Dir);
copyDir(v3Dir, v3v3Dir);
console.log('Replacing "zod" imports with "zod/v3" in v3-v3 directory...');
replaceZodImports(v3v3Dir);

console.log('Prebuild process completed successfully!');
