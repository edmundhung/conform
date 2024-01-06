import * as markdoc from '@markdoc/markdoc';
import { type Menu } from '~/components';

export function parse(markdown: string) {
	const content = markdown
		.replace(
			/<details>\n?\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs,
			'{% details summary="$1" %}$2{% /details %}',
		)
		.replace(/<!-- (\/?(aside|sandbox)( \w+=".+")*) -->/g, '{% $1 %}');
	const ast = markdoc.parse(content);
	const node = markdoc.transform(ast, {
		nodes: {
			fence: {
				render: 'Fence',
				attributes: {
					language: {
						type: String,
						description:
							'The programming language of the code block. Place it after the backticks.',
					},
				},
			},
			heading: {
				render: 'Heading',
				attributes: {
					level: { type: Number, required: true, default: 1 },
				},
			},
			link: {
				render: 'Link',
				attributes: {
					href: { type: String, required: true },
					title: { type: String },
				},
			},
		},
		tags: {
			aside: {
				render: 'Aside',
				description: 'Side notes',
			},
			sandbox: {
				render: 'Sandbox',
				description: 'To display an embedded sandbox',
				attributes: {
					title: {
						type: String,
						description: 'Title of the sandbox',
					},
					src: {
						type: String,
						required: true,
						description: 'Path to the source of the sandbox',
					},
				},
			},
			details: {
				render: 'Details',
				description: 'Native Details tag',
				attributes: {
					summary: {
						type: String,
						description: 'Summary of the block',
					},
				},
			},
		},
	});

	return node;
}

export function getIdFromHeading(heading: string) {
	return heading.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase();
}

export function getMenu(
	node: markdoc.RenderableTreeNode,
	menu: Menu = {
		title: 'On this page',
		links: [],
	},
): Menu {
	if (typeof node !== 'string' && node !== null) {
		// Match all h1, h2, h3… tags
		if (node.name === 'Heading' && node.attributes.level === 2) {
			const title = node.children[0];

			if (typeof title === 'string') {
				menu.links.push({
					title,
					to: `#${getIdFromHeading(title)}`,
				});
			}
		}

		if (node.children) {
			for (const child of node.children) {
				getMenu(child, menu);
			}
		}
	}

	return menu;
}
