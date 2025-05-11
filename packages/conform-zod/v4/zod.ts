let z: typeof import('@zod/mini');

try {
	z = require('@zod/mini');
} catch (e) {
	// If @zod/mini is not available, look for zod
	z = require('zod');
}

export const lazy = z.lazy;
export const pipe = z.pipe;
export const transform = z.transform;
export const union = z.union;
