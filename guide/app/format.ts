export function getIntroduction(content: string) {
	const lines = [];

	for (const line of content.split('\n')) {
		if (line.startsWith('## ')) {
			break;
		}

		if (line.startsWith('# ')) {
			lines.push('# Conform');
		} else {
			lines.push(line);
		}
	}

	return lines.join('\n');
}

export function formatTitle(text: string): string {
	return `${text.slice(0, 1).toUpperCase()}${text.slice(1).toLowerCase()}`;
}
