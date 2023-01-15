import type { RenderableTreeNodes } from '@markdoc/markdoc';
import { renderers } from '@markdoc/markdoc';
import { Link as RouterLink, useMatches } from '@remix-run/react';
import * as React from 'react';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import darcula from 'react-syntax-highlighter/dist/cjs/styles/prism/darcula';
import { getChildren, isTag } from './markdoc';

const style = {
	...darcula,
	'pre[class*="language-"]': {
		...darcula['pre[class*="language-"]'],
		background: '#111',
	},
};

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);
ReactSyntaxHighlighter.registerLanguage('css', css);

export function useRootLoaderData() {
	const [root] = useMatches();

	return root.data;
}

export function Sandbox({
	title,
	src,
	children,
}: {
	title: string;
	src: string;
	children: React.ReactNode;
}) {
	const { repository, branch } = useRootLoaderData();
	const [hydated, setHydrated] = React.useState(false);

	React.useEffect(() => {
		setHydrated(true);
	}, []);

	if (!hydated) {
		return children;
	}

	const url = new URL(
		`https://codesandbox.io/embed/github/${repository}/tree/${branch}${src}`,
	);

	url.searchParams.set('editorsize', '60');

	return (
		<iframe
			title={title}
			src={url.toString()}
			className="min-h-[70vh] my-6 w-full aspect-[16/9] outline outline-1 outline-zinc-800 outline-offset-4 rounded"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}

export function Aside({ children }: { children: React.ReactNode }) {
	return (
		<aside
			className={`
				-ml-4 xl:ml-0 mb-8 xl:float-right xl:sticky xl:top-16 xl:w-72 xl:-mr-72 xl:pl-4 xl:py-8 xl:-mt-48 xl:max-h-[calc(100vh-4rem)] overflow-y-auto
				prose-ul:list-none prose-ul:m-0 prose-ul:pl-4 prose-li:m-0 prose-li:pl-0 prose-headings:pl-4
				prose-a:block prose-a:py-2 prose-a:no-underline prose-a:font-normal prose-a:text-zinc-400 
				hover:prose-a:text-white  
			`}
		>
			{children}
		</aside>
	);
}

export function Fence({
	language,
	children,
}: {
	language: string;
	children: string;
}): React.ReactElement {
	return (
		<ReactSyntaxHighlighter
			language={language}
			style={style}
			showLineNumbers={language === 'tsx' || language === 'css'}
		>
			{children}
		</ReactSyntaxHighlighter>
	);
}

export function Details({
	summary,
	children,
}: {
	summary: string;
	children: React.ReactElement;
}) {
	return (
		<details className="border border-zinc-700 rounded p-4 my-6">
			<summary>{summary}</summary>
			{children}
		</details>
	);
}

export function Heading({
	level,
	children,
}: {
	level: number;
	children: React.ReactNode;
}) {
	const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	const id =
		typeof children === 'string'
			? children.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase()
			: '';

	return (
		<HeadingTag
			id={id}
			className="-mt-20 pt-20 lg:-mt-24 lg:pt-24 prose-a:inline-block prose-img:m-0"
		>
			{children}
		</HeadingTag>
	);
}

export function Link({
	href,
	title,
	children,
}: {
	href: string;
	title: string;
	children: React.ReactNode;
}) {
	const origin = 'https://conform.guide';
	const url = href.startsWith(origin) ? href.replace(origin, '') : href;

	if (
		url.startsWith('https://') ||
		url.startsWith('http://') ||
		url.startsWith('//')
	) {
		return (
			<a href={url} title={title}>
				{children}
			</a>
		);
	}

	let to = url;

	if (to.startsWith('/packages/')) {
		to = to.replace('/packages/conform-', '/api/').replace('/README.md', '');
	} else if (to.startsWith('/docs/')) {
		to = to.replace('/docs', '').replace('.md', '');
	} else {
		to = to.replace('.md', '');
	}

	return (
		<RouterLink to={to} title={title} prefetch="intent">
			{children}
		</RouterLink>
	);
}

export function Markdown({ content }: { content: RenderableTreeNodes }) {
	const hasSidebar =
		typeof getChildren(content).find(
			(node) => isTag(node) && node.name === 'Aside',
		) !== 'undefined';

	return (
		<section
			className={`prose prose-invert max-w-none prose-pre:!mt-6 prose-pre:!mb-8 prose-img:inline-block prose-img:m-0 ${
				hasSidebar ? 'xl:pr-72' : ''
			}`}
		>
			{renderers.react(content, React, {
				components: {
					Aside,
					Sandbox,
					Details,
					Fence,
					Heading,
					Link,
				},
			})}
		</section>
	);
}
