export function getIntroduction(content: string) {
	const lines = [];

	for (const line of content.split('\n')) {
		if (line.startsWith('## API References')) {
			break;
		}

		lines.push(line);
	}

	return lines.join('\n');
}

export function formatTitle(text: string): string {
	return `${text.slice(0, 1).toUpperCase()}${text.slice(1).toLowerCase()}`;
}

export function notFound() {
	return new Response('Not found', { status: 404, statusText: 'Not Found' });
}
