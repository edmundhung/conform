import type { RenderableTreeNodes } from '@markdoc/markdoc';
import { renderers } from '@markdoc/markdoc';
import { Link as RouterLink, useMatches } from '@remix-run/react';
import * as React from 'react';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import clsx from 'clsx';
import { MotionValue, useInView, useMotionValue } from 'framer-motion';
import { remToPx } from './util';
import { Tab } from '@headlessui/react';
import { create } from 'zustand';
import { ResourcePattern } from '~/pattern';

const style = {
	'code[class*="language-"]': {
		color: '#f8f8f2',
		background: 'none',
		textShadow: '0 1px rgba(0, 0, 0, 0.3)',
		fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
		textAlign: 'left',
		whiteSpace: 'pre',
		wordSpacing: 'normal',
		wordBreak: 'normal',
		wordWrap: 'normal',
		lineHeight: '1.5',
		MozTabSize: '4',
		OTabSize: '4',
		tabSize: '4',
		WebkitHyphens: 'none',
		MozHyphens: 'none',
		msHyphens: 'none',
		hyphens: 'none',
	},
	'pre[class*="language-"]': {
		color: 'var(--syntax-color-text)',
		background: 'dark:bg-white/2.5',
		textShadow: '0 1px rgba(0, 0, 0, 0.3)',
		fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
		textAlign: 'left',
		whiteSpace: 'pre',
		wordSpacing: 'normal',
		wordBreak: 'normal',
		wordWrap: 'normal',
		lineHeight: '1.5',
		MozTabSize: '4',
		OTabSize: '4',
		tabSize: '4',
		WebkitHyphens: 'none',
		MozHyphens: 'none',
		msHyphens: 'none',
		hyphens: 'none',
		padding: '1em',
		margin: '.5em 0',
		overflow: 'auto',
		borderRadius: '0.3em',
	},
	':not(pre) > code[class*="language-"]': {
		background: '#282a36',
		padding: '.1em',
		borderRadius: '.3em',
		whiteSpace: 'normal',
	},
	comment: {
		color: 'var(--syntax-token-comment)',
	},
	prolog: {
		color: 'var(--syntax-token-keyword)',
	},
	doctype: {
		color: 'var(--syntax-token-keyword)',
	},
	cdata: {
		color: 'var(--syntax-token-keyword)',
	},
	punctuation: {
		color: 'var(--syntax-token-punctuation)',
	},
	'.namespace': {
		Opacity: '.7',
	},
	property: {
		color: 'var(--syntax-token-parameter)',
	},
	tag: {
		color: 'var(--syntax-token-parameter)',
	},
	constant: {
		color: 'var(--syntax-token-constant)',
	},
	symbol: {
		color: 'var(--syntax-token-parameter)',
	},
	deleted: {
		color: 'var(--syntax-token-parameter)',
	},
	boolean: {
		color: 'var(--syntax-token-constant)',
	},
	number: {
		color: 'var(--syntax-token-constant)',
	},
	selector: {
		color: 'var(--syntax-token-string)',
	},
	'attr-name': {
		color: 'var(--syntax-color-text)',
	},
	string: {
		color: 'var(--syntax-token-string)',
	},
	char: {
		color: 'var(--syntax-token-string)',
	},
	builtin: {
		color: 'var(--syntax-token-string)',
	},
	inserted: {
		color: 'var(--syntax-token-string)',
	},
	operator: {
		color: 'var(--syntax-color-text)',
	},
	entity: {
		color: 'var(--syntax-color-text)',
		cursor: 'help',
	},
	url: {
		color: 'var(--syntax-color-text)',
	},
	'.language-css .token.string': {
		color: 'var(--syntax-color-text)',
	},
	'.style .token.string': {
		color: 'var(--syntax-color-text)',
	},
	variable: {
		color: 'var(--syntax-color-text)',
	},
	atrule: {
		color: 'var(--syntax-token-function)',
	},
	'attr-value': {
		color: 'var(--syntax-token-string)',
	},
	function: {
		color: 'var(--syntax-token-function)',
	},
	'class-name': {
		color: 'var(--syntax-token-function)',
	},
	keyword: {
		color: 'var(--syntax-token-keyword)',
	},
	regex: {
		color: 'var(--syntax-token-string)',
	},
	important: {
		color: 'var(--syntax-token-string)',
		fontWeight: 'bold',
	},
	bold: {
		fontWeight: 'bold',
	},
	italic: {
		fontStyle: 'italic',
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

interface ButtonLinkProps extends React.ComponentProps<typeof RouterLink> {
	variant?: keyof typeof variantStylesForButton;
	arrow?: 'left' | 'right';
}

const variantStylesForButton = {
	primary:
		'rounded-full bg-zinc-900 py-1 px-3 text-white hover:bg-zinc-700 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-1 dark:ring-inset dark:ring-emerald-400/20 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300 dark:hover:ring-emerald-300',
	secondary:
		'rounded-full bg-zinc-100 py-1 px-3 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
	filled:
		'rounded-full bg-zinc-900 py-1 px-3 text-white hover:bg-zinc-700 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400',
	outline:
		'rounded-full py-1 px-3 text-zinc-700 ring-1 ring-inset ring-zinc-900/10 hover:bg-zinc-900/2.5 hover:text-zinc-900 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-white',
	text: 'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-500',
};

export function ButtonLink({
	variant = 'primary',
	className,
	children,
	arrow,
	...props
}: ButtonLinkProps) {
	const arrowIcon = (
		<svg
			className={clsx(
				'mt-0.5 h-5 w-5',
				variant === 'text' && 'relative top-px',
				arrow === 'left' && '-ml-1 rotate-180',
				arrow === 'right' && '-mr-1',
			)}
			viewBox="0 0 20 20"
			fill="none"
			aria-hidden="true"
		>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9"
			/>
		</svg>
	);

	return (
		<RouterLink
			className={clsx(
				'inline-flex gap-0.5 justify-center overflow-hidden text-sm font-medium transition',
				variantStylesForButton[variant],
				className,
			)}
			{...props}
		>
			{arrow === 'left' ? arrowIcon : null}
			{children}
			{arrow === 'right' ? arrowIcon : null}
		</RouterLink>
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

export function Lead({ children }: { children: React.ReactNode }) {
	return (
		<div
			className={`
				lead
			`}
		>
			{children}
		</div>
	);
}

function InfoIcon(props) {
	return (
		<svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
			<circle cx="8" cy="8" r="8" strokeWidth="0" />
			<path
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
				d="M6.75 7.75h1.5v3.5"
			/>
			<circle cx="8" cy="4" r=".5" fill="none" />
		</svg>
	);
}

// export function Grid({ children }: { children: React.ReactNode }) {
// 	return (
// 		<div
// 			className={`
// 			  mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3
// 			`}
// 		>
// 			{children}
// 		</div>
// 	);
// }

// export function Cell({
// 	image,
// 	children,
// }: {
// 	image: string;
// 	children: React.ReactNode;
// }) {
// 	return (
// 		<div
// 			className={`
// 				prose-h3:text-sm prose-h3:font-semibold prose-h3:text-zinc-900 dark:prose-h3:text-white
// 				prose-p:mt-1 prose-p:text-sm prose-p:text-zinc-600 dark:prose-p:text-zinc-400
// 				prose-a:inline-flex prose-a:gap-0.5 prose-a:justify-center prose-a:overflow-hidden prose-a:text-sm prose-a:font-medium prose-a:transition prose-a:text-emerald-500 hover:prose-a:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-500
// 			`}
// 		>
// 			<div className="flex flex-row-reverse gap-6">
// 				<div className="flex-auto">{children}</div>
// 				<img
// 					className="h-12 w-12"
// 					src="https://protocol.tailwindui.com/_next/static/media/go.135b57cb.svg"
// 					alt={image}
// 				/>
// 			</div>
// 		</div>
// 	);
// }

interface Gridcell {
	name: String;
	to: String;
	tocontent: String;
	description: String;
}

export function Grid({ gridcells, type }: { gridcells: Gridcell[]; string }) {
	return (
		// <div className="my-16 xl:max-w-none">
		//   <Heading level={2} id="official-libraries">
		//     Official libraries
		//   </Heading>
		<div className="not-prose mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3">
			{/* <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-4"> */}
			{gridcells.map((cell) => (
				<div key={cell.name} className="flex flex-row-reverse gap-6">
					<div className="flex-auto">
						<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
							{cell.name}
						</h3>
						<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
							{cell.description}
						</p>
						<p className="mt-4">
							<a href={cell.to}>{cell.tocontent}</a>
						</p>
					</div>
					{type === 'sdk' ? (
						<img
							href={cell.image}
							alt={cell.image}
							className="h-12 w-12"
							unoptimized
						/>
					) : null}
				</div>
			))}
		</div>
		// </div>
	);
}

interface Resource {
	name: String;
	to: String;
	description: String;
	pattern: {
		y: number;
		squares: Array<[number, number]>;
	};
}

export function Resources({ resources }: { resources: Resource[] }) {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	return (
		<div className="my-16 xl:max-w-none">
			<Heading level={2} id="resources">
				Resources
			</Heading>
			<div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-4">
				{resources.map((resource) => (
					<div
						key={resource.to}
						className="group relative flex rounded-2xl bg-zinc-50 transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:bg-white/2.5 dark:hover:shadow-black/5"
						onMouseMove={(event) => {
							const { left, top } = event.currentTarget.getBoundingClientRect();
							mouseX.set(event.clientX - left);
							mouseY.set(event.clientY - top);
						}}
					>
						<ResourcePattern
							{...resource.pattern}
							mouseX={mouseX}
							mouseY={mouseY}
						/>
						<div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-zinc-900/7.5 group-hover:ring-zinc-900/10 dark:ring-white/10 dark:group-hover:ring-white/20" />
						<div className="relative rounded-2xl px-4 pt-16 pb-4">
							{/* <ResourceIcon icon={resource.icon} /> */}
							<h3 className="mt-4 text-sm font-semibold leading-7 text-zinc-900 dark:text-white">
								<a href={resource.to}>
									<span className="absolute inset-0 rounded-2xl" />
									{resource.name}
								</a>
							</h3>
							<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
								{resource.description}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
interface Attribute {
	name: string;
	type: string;
	description: string;
}

export function Attributes({ attributes }: { attributes: Attribute[] }) {
	return (
		<div className="my-6">
			<ul className="m-0 max-w-[calc(theme(maxWidth.lg)-theme(spacing.8))] list-none divide-y divide-zinc-900/5 p-0 dark:divide-white/5">
				{attributes.map((attr) => (
					<li key={attr.name} className="m-0 px-0 py-4 first:pt-0 last:pb-0">
						<dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
							<dt className="sr-only">Name</dt>
							<dd>
								<code>{attr.name}</code>
							</dd>
							<dt className="sr-only">Type</dt>
							<dd className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
								{attr.type}
							</dd>
							<dt className="sr-only">Description</dt>
							<dd className="w-full flex-none [&amp;>:first-child]:mt-0 [&amp;>:last-child]:mb-0">
								{attr.description}
							</dd>
						</dl>
					</li>
				))}
			</ul>
		</div>
	);
}

export function Row({ children }: { children: React.ReactNode }) {
	return (
		<div
			className={`
				grid grid-cols-1 items-start gap-x-16 gap-y-10 xl:max-w-none xl:grid-cols-2
			`}
		>
			{children}
		</div>
	);
}

export function Col({ children, sticky = false }) {
	return (
		<div
			className={clsx(
				'[&>:first-child]:mt-0 [&>:last-child]:mb-0',
				sticky && 'xl:sticky xl:top-24',
			)}
		>
			{children}
		</div>
	);
}

// from Code.jsx
const languageNames = {
	tsx: 'TypeScript1',
	ts: 'TypeScript2',
	typescript: 'TypeScript3',
};

function getPanelTitle({ title, language }) {
	return title ?? languageNames[language] ?? 'Code';
}

function ClipboardIcon(props) {
	return (
		<svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
			<path
				strokeWidth="0"
				d="M5.5 13.5v-5a2 2 0 0 1 2-2l.447-.894A2 2 0 0 1 9.737 4.5h.527a2 2 0 0 1 1.789 1.106l.447.894a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2Z"
			/>
			<path
				fill="none"
				strokeLinejoin="round"
				d="M12.5 6.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2m5 0-.447-.894a2 2 0 0 0-1.79-1.106h-.527a2 2 0 0 0-1.789 1.106L7.5 6.5m5 0-1 1h-3l-1-1"
			/>
		</svg>
	);
}

function CopyButton({ code }) {
	let [copyCount, setCopyCount] = React.useState(0);
	let copied = copyCount > 0;

	React.useEffect(() => {
		if (copyCount > 0) {
			let timeout = setTimeout(() => setCopyCount(0), 1000);
			return () => {
				clearTimeout(timeout);
			};
		}
	}, [copyCount]);

	return (
		<button
			type="button"
			className={clsx(
				'group/button absolute top-3.5 right-4 overflow-hidden rounded-full py-1 pl-2 pr-3 text-2xs font-medium opacity-0 backdrop-blur transition focus:opacity-100 group-hover:opacity-100',
				copied
					? 'bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/20'
					: 'bg-white/5 hover:bg-white/7.5 dark:bg-white/2.5 dark:hover:bg-white/5',
			)}
			onClick={() => {
				window.navigator.clipboard.writeText(code).then(() => {
					setCopyCount((count) => count + 1);
				});
			}}
		>
			<span
				aria-hidden={copied}
				className={clsx(
					'pointer-events-none flex items-center gap-0.5 text-zinc-400 transition duration-300',
					copied && '-translate-y-1.5 opacity-0',
				)}
			>
				<ClipboardIcon className="h-5 w-5 fill-zinc-500/20 stroke-zinc-500 transition-colors group-hover/button:stroke-zinc-400" />
				Copy
			</span>
			<span
				aria-hidden={!copied}
				className={clsx(
					'pointer-events-none absolute inset-0 flex items-center justify-center text-emerald-400 transition duration-300',
					!copied && 'translate-y-1.5 opacity-0',
				)}
			>
				Copied!
			</span>
		</button>
	);
}

function CodePanelHeader({ tag, label }) {
	if (!tag && !label) {
		return null;
	}

	return (
		<div className="flex h-9 items-center gap-2 border-y border-t-transparent border-b-white/7.5 bg-zinc-900 bg-white/2.5 px-4 dark:border-b-white/5 dark:bg-white/1">
			{tag && (
				<div className="dark flex">
					<Tag variant="small">{tag}</Tag>
				</div>
			)}
			{tag && label && (
				<span className="h-0.5 w-0.5 rounded-full bg-zinc-500" />
			)}
			{label && (
				<span className="font-mono text-xs text-zinc-400">{label}</span>
			)}
		</div>
	);
}

function CodePanel({ tag, label, code, children }) {
	let child = React.Children.only(children);

	return (
		<div className="group dark:bg-white/2.5">
			<CodePanelHeader
				tag={child.props.tag ?? tag}
				label={child.props.label ?? label}
			/>
			<div className="relative">
				<pre className="overflow-x-auto p-4 text-xs text-white">{children}</pre>
				<CopyButton code={child.props.code ?? code} />
			</div>
		</div>
	);
}

function CodeGroupHeader({ title, children, selectedIndex }) {
	let hasTabs = React.Children.count(children) > 1;

	if (!title && !hasTabs) {
		return null;
	}

	return (
		<div className="flex min-h-[calc(theme(spacing.12)+1px)] flex-wrap items-start gap-x-4 border-b border-zinc-700 bg-zinc-800 px-4 dark:border-zinc-800 dark:bg-transparent">
			{title && (
				<h3 className="mr-auto pt-3 text-xs font-semibold text-white">
					{title}
				</h3>
			)}
			{hasTabs && (
				<Tab.List className="-mb-px flex gap-4 text-xs font-medium">
					{React.Children.map(children, (child, childIndex) => (
						<Tab
							className={clsx(
								'border-b py-3 transition focus:[&:not(:focus-visible)]:outline-none',
								childIndex === selectedIndex
									? 'border-emerald-500 text-emerald-400'
									: 'border-transparent text-zinc-400 hover:text-zinc-300',
							)}
						>
							{getPanelTitle(child.props)}
						</Tab>
					))}
				</Tab.List>
			)}
		</div>
	);
}

function CodeGroupPanels({ children, ...props }) {
	let hasTabs = React.Children.count(children) > 1;

	if (hasTabs) {
		return (
			<Tab.Panels>
				{React.Children.map(children, (child) => (
					<Tab.Panel>
						<CodePanel {...props}>{child}</CodePanel>
					</Tab.Panel>
				))}
			</Tab.Panels>
		);
	}

	return <CodePanel {...props}>{children}</CodePanel>;
}

function usePreventLayoutShift() {
	let positionRef = React.useRef();
	let rafRef = React.useRef();

	React.useEffect(() => {
		return () => {
			window.cancelAnimationFrame(rafRef.current);
		};
	}, []);

	return {
		positionRef,
		preventLayoutShift(callback) {
			let initialTop = positionRef.current.getBoundingClientRect().top;

			callback();

			rafRef.current = window.requestAnimationFrame(() => {
				let newTop = positionRef.current.getBoundingClientRect().top;
				window.scrollBy(0, newTop - initialTop);
			});
		},
	};
}

const usePreferredLanguageStore = create((set) => ({
	preferredLanguages: [],
	addPreferredLanguage: (language) =>
		set((state) => ({
			preferredLanguages: [
				...state.preferredLanguages.filter(
					(preferredLanguage) => preferredLanguage !== language,
				),
				language,
			],
		})),
}));

function useTabGroupProps(availableLanguages) {
	let { preferredLanguages, addPreferredLanguage } =
		usePreferredLanguageStore();
	let [selectedIndex, setSelectedIndex] = React.useState(0);
	let activeLanguage = [...availableLanguages].sort(
		(a, z) => preferredLanguages.indexOf(z) - preferredLanguages.indexOf(a),
	)[0];
	let languageIndex = availableLanguages.indexOf(activeLanguage);
	let newSelectedIndex = languageIndex === -1 ? selectedIndex : languageIndex;
	if (newSelectedIndex !== selectedIndex) {
		setSelectedIndex(newSelectedIndex);
	}

	let { positionRef, preventLayoutShift } = usePreventLayoutShift();

	return {
		as: 'div',
		ref: positionRef,
		selectedIndex,
		onChange: (newSelectedIndex) => {
			preventLayoutShift(() =>
				addPreferredLanguage(availableLanguages[newSelectedIndex]),
			);
		},
	};
}

const CodeGroupContext = React.createContext(false);

export function CodeGroup({ children, title, ...props }) {
	let languages = React.Children.map(children, (child) =>
		getPanelTitle(child.props),
	);
	let tabGroupProps = useTabGroupProps(languages);
	let hasTabs = React.Children.count(children) > 1;
	let Container = hasTabs ? Tab.Group : 'div';
	let containerProps = hasTabs ? tabGroupProps : {};
	let headerProps = hasTabs
		? { selectedIndex: tabGroupProps.selectedIndex }
		: {};

	return (
		<CodeGroupContext.Provider value={true}>
			<Container
				{...containerProps}
				className="not-prose my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10"
			>
				<CodeGroupHeader title={title} {...headerProps}>
					{children}
				</CodeGroupHeader>
				<CodeGroupPanels {...props}>{children}</CodeGroupPanels>
			</Container>
		</CodeGroupContext.Provider>
	);
}

export function Code({ children, ...props }) {
	let isGrouped = React.useContext(CodeGroupContext);

	if (isGrouped) {
		return <code {...props} dangerouslySetInnerHTML={{ __html: children }} />;
	}

	return <code {...props}>{children}</code>;
}
// end from Code.jsx

export function BlockQuote({ children }) {
	return (
		<div className="my-6 flex gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 leading-6 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-200 dark:[--tw-prose-links:theme(colors.white)] dark:[--tw-prose-links-hover:theme(colors.emerald.300)]">
			<InfoIcon className="mt-1 h-4 w-4 flex-none fill-emerald-500 stroke-white dark:fill-emerald-200/20 dark:stroke-emerald-200" />
			<div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
				{children}
			</div>
		</div>
	);
}

export function Fence({
	language,
	children,
	...props
}: {
	language: string;
	children: string;
}): React.ReactElement {
	const isGrouped = React.useContext(CodeGroupContext);
	const code = (
		<ReactSyntaxHighlighter
			language={language}
			style={style}
			showLineNumbers={language === 'tsx' || language === 'css'}
		>
			{children}
		</ReactSyntaxHighlighter>
	);

	if (isGrouped) {
		return code;
	}

	return <CodeGroup {...props}>{code}</CodeGroup>;
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

interface HeaderProps
	extends React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLHeadingElement>,
		HTMLHeadingElement
	> {
	level?: 1 | 2 | 3 | 4 | 5 | 6;
	tag?: string;
	label?: string;
	anchor?: boolean;
}

export function Heading({
	level = 2,
	children,
	id,
	tag,
	label,
	anchor = true,
	...props
}: HeaderProps) {
	const Component = `h${level}` as const;
	const ref = React.useRef<HTMLHeadingElement>(null);
	// const registerHeading = useSectionStore((s) => s.registerHeading);
	const inView = useInView(ref, {
		margin: `${remToPx(-3.5)}px 0px 0px 0px`,
		amount: 'all',
	});
	const hash =
		id ??
		(typeof children === 'string'
			? children.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase()
			: '');

	// useEffect(() => {
	// 	if (level === 2) {
	// 		registerHeading({ id, ref, offsetRem: tag || label ? 8 : 6 });
	// 	}
	// }, [level, registerHeading]);

	return (
		<>
			{tag || label ? (
				<div className="flex items-center gap-x-3">
					{tag && <Tag>{tag}</Tag>}
					{tag && label && (
						<span className="h-0.5 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
					)}
					{label && (
						<span className="font-mono text-xs text-zinc-400">{label}</span>
					)}
				</div>
			) : null}
			<Component
				ref={ref}
				id={anchor ? hash : undefined}
				className={tag || label ? 'mt-2 scroll-mt-32' : 'scroll-mt-24'}
				{...props}
			>
				{anchor ? (
					<RouterLink
						to={`#${hash}`}
						className="group text-inherit no-underline hover:text-inherit"
					>
						{inView && (
							<div className="absolute mt-1 ml-[calc(-1*var(--width))] hidden w-[var(--width)] opacity-0 transition [--width:calc(2.625rem+0.5px+50%-min(50%,calc(theme(maxWidth.lg)+theme(spacing.8))))] group-hover:opacity-100 group-focus:opacity-100 md:block lg:z-50 2xl:[--width:theme(spacing.10)]">
								<div className="group/anchor block h-5 w-5 rounded-lg bg-zinc-50 ring-1 ring-inset ring-zinc-300 transition hover:ring-zinc-500 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:ring-zinc-600">
									<svg
										className="h-5 w-5 stroke-zinc-500 transition dark:stroke-zinc-400 dark:group-hover/anchor:stroke-white"
										viewBox="0 0 20 20"
										fill="none"
										strokeLinecap="round"
										aria-hidden="true"
									>
										<path d="m6.5 11.5-.964-.964a3.535 3.535 0 1 1 5-5l.964.964m2 2 .964.964a3.536 3.536 0 0 1-5 5L8.5 13.5m0-5 3 3" />
									</svg>
								</div>
							</div>
						)}
						{children}
					</RouterLink>
				) : (
					children
				)}
			</Component>
		</>
	);
}

interface TagProps {
	variant?: keyof typeof variantStyles;
	color?: keyof typeof colorStyles;
	children: string;
}

const variantStyles = {
	small: '',
	medium: 'rounded-lg px-1.5 ring-1 ring-inset',
};

const colorStyles = {
	emerald: {
		small: 'text-emerald-500 dark:text-emerald-400',
		medium:
			'ring-emerald-300 dark:ring-emerald-400/30 bg-emerald-400/10 text-emerald-500 dark:text-emerald-400',
	},
	sky: {
		small: 'text-sky-500',
		medium:
			'ring-sky-300 bg-sky-400/10 text-sky-500 dark:ring-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400',
	},
	amber: {
		small: 'text-amber-500',
		medium:
			'ring-amber-300 bg-amber-400/10 text-amber-500 dark:ring-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400',
	},
	rose: {
		small: 'text-red-500 dark:text-rose-500',
		medium:
			'ring-rose-200 bg-rose-50 text-red-500 dark:ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-400',
	},
	zinc: {
		small: 'text-zinc-400 dark:text-zinc-500',
		medium:
			'ring-zinc-200 bg-zinc-50 text-zinc-500 dark:ring-zinc-500/20 dark:bg-zinc-400/10 dark:text-zinc-400',
	},
};

const valueColorMap: Record<string, keyof typeof colorStyles> = {
	get: 'emerald',
	post: 'sky',
	put: 'amber',
	delete: 'rose',
};

export function Tag({
	children,
	variant = 'medium',
	color = valueColorMap[children.toLowerCase()] ?? 'emerald',
}: TagProps) {
	return (
		<span
			className={clsx(
				'font-mono text-[0.625rem] font-semibold leading-6',
				variantStyles[variant],
				colorStyles[color][variant],
			)}
		>
			{children}
		</span>
	);
}

interface LinkProps {
	href: string;
	title: string;
	children: React.ReactNode;
}

export function Link({ href, title, children }: LinkProps) {
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
	return (
		<div className="prose dark:prose-invert max-w-none">
			{renderers.react(content, React, {
				components: {
					Lead,
					Grid,
					Resources,
					Attributes,
					Row,
					Col,
					CodeGroup,
					Aside,
					Sandbox,
					Details,
					BlockQuote,
					Fence,
					Heading,
					Link,
				},
			})}
		</div>
	);
}
