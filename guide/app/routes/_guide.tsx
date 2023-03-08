import { Link, Outlet, useLocation, useNavigate } from '@remix-run/react';
import {
	useEffect,
	useState,
	useId,
	useRef,
	forwardRef,
	createContext,
	Fragment,
	useContext,
	useLayoutEffect,
} from 'react';
import clsx from 'clsx';
import {
	AnimatePresence,
	motion,
	useIsPresent,
	useScroll,
	useTransform,
} from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { create, createStore, useStore } from 'zustand';
import { createAutocomplete } from '@algolia/autocomplete-core';
import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia';
import algoliasearch from 'algoliasearch/lite';

interface Navigation2 {
	title: string;
	menus: Array<{
		title: string;
		to: string;
	}>;
}

// const navigations: Navigation[] = [
export const navigation = [
	{
		title: 'Get Started',
		menus: [
			{ title: 'Overview', to: '/' },
			{ title: 'Tutorial', to: '/tutorial' },
			{ title: 'Examples', to: '/examples' },
		],
	},
	{
		title: 'Guides',
		menus: [
			{ title: 'Validation', to: '/validation' },
			{ title: 'Integrations', to: '/integrations' },
			{ title: 'Nested object and Array', to: '/configuration' },
			{ title: 'Intent button', to: '/intent-button' },
			{ title: 'File Upload', to: '/file-upload' },
			{ title: 'Focus management', to: '/focus-management' },
			{ title: 'Accessibility', to: '/accessibility' },
		],
	},
	{
		title: 'API Reference',
		menus: [
			{ title: '@conform-to/react', to: '/api/react' },
			{ title: '@conform-to/yup', to: '/api/yup' },
			{ title: '@conform-to/zod', to: '/api/zod' },
		],
	},
];

// from GridPattern.jsx
export function GridPattern({ width, height, x, y, squares, ...props }) {
	let patternId = useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern
					id={patternId}
					width={width}
					height={height}
					patternUnits="userSpaceOnUse"
					x={x}
					y={y}
				>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect
				width="100%"
				height="100%"
				strokeWidth={0}
				fill={`url(#${patternId})`}
			/>
			{squares && (
				<svg x={x} y={y} className="overflow-visible">
					{squares.map(([x, y]) => (
						<rect
							strokeWidth="0"
							key={`${x}-${y}`}
							width={width + 1}
							height={height + 1}
							x={x * width}
							y={y * height}
						/>
					))}
				</svg>
			)}
		</svg>
	);
}

// from HeroPattern.jsx
export function HeroPattern() {
	return (
		<div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
			<div className="absolute left-1/2 top-0 ml-[-38rem] h-[25rem] w-[81.25rem] dark:[mask-image:linear-gradient(white,transparent)]">
				<div className="absolute inset-0 bg-gradient-to-r from-[#36b49f] to-[#DBFF75] opacity-40 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-[#36b49f]/30 dark:to-[#DBFF75]/30 dark:opacity-100">
					<GridPattern
						width={72}
						height={56}
						x="-12"
						y="4"
						squares={[
							[4, 3],
							[2, 1],
							[7, 3],
							[10, 6],
						]}
						className="absolute inset-x-0 inset-y-[-50%] h-[200%] w-full skew-y-[-18deg] fill-black/40 stroke-black/50 mix-blend-overlay dark:fill-white/2.5 dark:stroke-white/5"
					/>
				</div>
				<svg
					viewBox="0 0 1113 440"
					aria-hidden="true"
					className="absolute top-0 left-1/2 ml-[-19rem] w-[69.5625rem] fill-white blur-[26px] dark:hidden"
				>
					<path d="M.016 439.5s-9.5-300 434-300S882.516 20 882.516 20V0h230.004v439.5H.016Z" />
				</svg>
			</div>
		</div>
	);
}

// from remToPx.js
export function remToPx(remValue) {
	let rootFontSize =
		typeof window === 'undefined'
			? 16
			: parseFloat(window.getComputedStyle(document.documentElement).fontSize);

	return parseFloat(remValue) * rootFontSize;
}

// from Tag.jsx
const variantStyles = {
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

const valueColorMap = {
	get: 'emerald',
	post: 'sky',
	put: 'amber',
	delete: 'rose',
};

export function Tag({
	children,
	variant = 'medium',
	color = valueColorMap[children.toLowerCase()] ?? 'emerald',
}) {
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

// from Button.jsx
function ArrowIcon(props) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9"
			/>
		</svg>
	);
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

export function Button({
	variant = 'primary',
	className,
	children,
	arrow,
	...props
}) {
	let Component = props.to ? Link : 'button';

	className = clsx(
		'inline-flex gap-0.5 justify-center overflow-hidden text-sm font-medium transition',
		variantStylesForButton[variant],
		className,
	);

	let arrowIcon = (
		<ArrowIcon
			className={clsx(
				'mt-0.5 h-5 w-5',
				variant === 'text' && 'relative top-px',
				arrow === 'left' && '-ml-1 rotate-180',
				arrow === 'right' && '-mr-1',
			)}
		/>
	);

	return (
		<Component className={className} {...props}>
			{arrow === 'left' && arrowIcon}
			{children}
			{arrow === 'right' && arrowIcon}
		</Component>
	);
}

// from SectionProvider.jsx
function createSectionStore(sections) {
	return createStore((set) => ({
		sections,
		visibleSections: [],
		setVisibleSections: (visibleSections) =>
			set((state) =>
				state.visibleSections.join() === visibleSections.join()
					? {}
					: { visibleSections },
			),
		registerHeading: ({ id, ref, offsetRem }) =>
			set((state) => {
				return {
					sections: state.sections.map((section) => {
						if (section.id === id) {
							return {
								...section,
								headingRef: ref,
								offsetRem,
							};
						}
						return section;
					}),
				};
			}),
	}));
}

function useVisibleSections(sectionStore) {
	let setVisibleSections = useStore(sectionStore, (s) => s.setVisibleSections);
	let sections = useStore(sectionStore, (s) => s.sections);

	useEffect(() => {
		function checkVisibleSections() {
			let { innerHeight, scrollY } = window;
			let newVisibleSections = [];

			for (
				let sectionIndex = 0;
				sectionIndex < sections.length;
				sectionIndex++
			) {
				let { id, headingRef, offsetRem } = sections[sectionIndex];
				let offset = remToPx(offsetRem);
				let top = headingRef.current.getBoundingClientRect().top + scrollY;

				if (sectionIndex === 0 && top - offset > scrollY) {
					newVisibleSections.push('_top');
				}

				let nextSection = sections[sectionIndex + 1];
				let bottom =
					(nextSection?.headingRef.current.getBoundingClientRect().top ??
						Infinity) +
					scrollY -
					remToPx(nextSection?.offsetRem ?? 0);

				if (
					(top > scrollY && top < scrollY + innerHeight) ||
					(bottom > scrollY && bottom < scrollY + innerHeight) ||
					(top <= scrollY && bottom >= scrollY + innerHeight)
				) {
					newVisibleSections.push(id);
				}
			}

			setVisibleSections(newVisibleSections);
		}

		let raf = window.requestAnimationFrame(() => checkVisibleSections());
		window.addEventListener('scroll', checkVisibleSections, { passive: true });
		window.addEventListener('resize', checkVisibleSections);

		return () => {
			window.cancelAnimationFrame(raf);
			window.removeEventListener('scroll', checkVisibleSections);
			window.removeEventListener('resize', checkVisibleSections);
		};
	}, [setVisibleSections, sections]);
}

const SectionStoreContext = createContext();

const useIsomorphicLayoutEffect =
	typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function SectionProvider({ sections, children }) {
	let [sectionStore] = useState(() => createSectionStore(sections));

	useVisibleSections(sectionStore);

	useIsomorphicLayoutEffect(() => {
		sectionStore.setState({ sections });
	}, [sectionStore, sections]);

	return (
		<SectionStoreContext.Provider value={sectionStore}>
			{children}
		</SectionStoreContext.Provider>
	);
}

export function useSectionStore(selector) {
	let store = useContext(SectionStoreContext);
	return useStore(store, selector);
}

// from ModeToggle.jsx
function SunIcon(props) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
			<path
				strokeLinecap="round"
				d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
			/>
		</svg>
	);
}

function MoonIcon(props) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
		</svg>
	);
}

export function ModeToggle() {
	function disableTransitionsTemporarily() {
		document.documentElement.classList.add('[&_*]:!transition-none');
		window.setTimeout(() => {
			document.documentElement.classList.remove('[&_*]:!transition-none');
		}, 0);
	}

	function toggleMode() {
		disableTransitionsTemporarily();

		let darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		let isSystemDarkMode = darkModeMediaQuery.matches;
		let isDarkMode = document.documentElement.classList.toggle('dark');

		if (isDarkMode === isSystemDarkMode) {
			delete window.localStorage.isDarkMode;
		} else {
			window.localStorage.isDarkMode = isDarkMode;
		}
	}

	return (
		<button
			type="button"
			className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
			aria-label="Toggle dark mode"
			onClick={toggleMode}
		>
			<SunIcon className="h-5 w-5 stroke-zinc-900 dark:hidden" />
			<MoonIcon className="hidden h-5 w-5 stroke-white dark:block" />
		</button>
	);
}

// from Search.jsx
const searchClient = algoliasearch(
	'process.env.PUBLIC_DOCSEARCH_APP_ID',
	'process.env.PUBLIC_DOCSEARCH_API_KEY',
);

function useAutocomplete() {
	let id = useId();
	let navigate = useNavigate();
	let [autocompleteState, setAutocompleteState] = useState({});

	let [autocomplete] = useState(() =>
		createAutocomplete({
			id,
			placeholder: 'Find something...',
			defaultActiveItemId: 0,
			onStateChange({ state }) {
				setAutocompleteState(state);
			},
			shouldPanelOpen({ state }) {
				return state.query !== '';
			},
			navigator: {
				navigate({ itemUrl }) {
					autocomplete.setIsOpen(true);
					navigate(itemUrl);
				},
			},
			getSources() {
				return [
					{
						sourceId: 'documentation',
						getItemInputValue({ item }) {
							return item.query;
						},
						getItemUrl({ item }) {
							let url = new URL(item.url);
							return `${url.pathname}${url.hash}`;
						},
						onSelect({ itemUrl }) {
							navigate(itemUrl);
						},
						getItems({ query }) {
							return getAlgoliaResults({
								searchClient,
								queries: [
									{
										query,
										indexName: 'process.env.PUBLIC_DOCSEARCH_INDEX_NAME',
										params: {
											hitsPerPage: 5,
											highlightPreTag:
												'<mark class="underline bg-transparent text-emerald-500">',
											highlightPostTag: '</mark>',
										},
									},
								],
							});
						},
					},
				];
			},
		}),
	);

	return { autocomplete, autocompleteState };
}

function resolveResult(result) {
	let allLevels = Object.keys(result.hierarchy);
	let hierarchy = Object.entries(result._highlightResult.hierarchy).filter(
		([, { value }]) => Boolean(value),
	);
	let levels = hierarchy.map(([level]) => level);

	let level =
		result.type === 'content'
			? levels.pop()
			: levels
					.filter(
						(level) =>
							allLevels.indexOf(level) <= allLevels.indexOf(result.type),
					)
					.pop();

	return {
		titleHtml: result._highlightResult.hierarchy[level].value,
		hierarchyHtml: hierarchy
			.slice(0, levels.indexOf(level))
			.map(([, { value }]) => value),
	};
}

function SearchIcon(props) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
			/>
		</svg>
	);
}

function NoResultsIcon(props) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12.01 12a4.237 4.237 0 0 0 1.24-3c0-.62-.132-1.207-.37-1.738M12.01 12A4.237 4.237 0 0 1 9 13.25c-.635 0-1.237-.14-1.777-.388M12.01 12l3.24 3.25m-3.715-9.661a4.25 4.25 0 0 0-5.975 5.908M4.5 15.5l11-11"
			/>
		</svg>
	);
}

function LoadingIcon(props) {
	let id = useId();

	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<circle cx="10" cy="10" r="5.5" strokeLinejoin="round" />
			<path
				stroke={`url(#${id})`}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15.5 10a5.5 5.5 0 1 0-5.5 5.5"
			/>
			<defs>
				<linearGradient
					id={id}
					x1="13"
					x2="9.5"
					y1="9"
					y2="15"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="currentColor" />
					<stop offset="1" stopColor="currentColor" stopOpacity="0" />
				</linearGradient>
			</defs>
		</svg>
	);
}

function SearchResult({ result, resultIndex, autocomplete, collection }) {
	let id = useId();
	let { titleHtml, hierarchyHtml } = resolveResult(result);

	return (
		<li
			className={clsx(
				'group block cursor-default px-4 py-3 aria-selected:bg-zinc-50 dark:aria-selected:bg-zinc-800/50',
				resultIndex > 0 && 'border-t border-zinc-100 dark:border-zinc-800',
			)}
			aria-labelledby={`${id}-hierarchy ${id}-title`}
			{...autocomplete.getItemProps({
				item: result,
				source: collection.source,
			})}
		>
			<div
				id={`${id}-title`}
				aria-hidden="true"
				className="text-sm font-medium text-zinc-900 group-aria-selected:text-emerald-500 dark:text-white"
				dangerouslySetInnerHTML={{ __html: titleHtml }}
			/>
			{hierarchyHtml.length > 0 && (
				<div
					id={`${id}-hierarchy`}
					aria-hidden="true"
					className="mt-1 truncate whitespace-nowrap text-2xs text-zinc-500"
				>
					{hierarchyHtml.map((item, itemIndex, items) => (
						<Fragment key={itemIndex}>
							<span dangerouslySetInnerHTML={{ __html: item }} />
							<span
								className={
									itemIndex === items.length - 1
										? 'sr-only'
										: 'mx-2 text-zinc-300 dark:text-zinc-700'
								}
							>
								/
							</span>
						</Fragment>
					))}
				</div>
			)}
		</li>
	);
}

function SearchResults({ autocomplete, query, collection }) {
	if (collection.items.length === 0) {
		return (
			<div className="p-6 text-center">
				<NoResultsIcon className="mx-auto h-5 w-5 stroke-zinc-900 dark:stroke-zinc-600" />
				<p className="mt-2 text-xs text-zinc-700 dark:text-zinc-400">
					Nothing found for{' '}
					<strong className="break-words font-semibold text-zinc-900 dark:text-white">
						&lsquo;{query}&rsquo;
					</strong>
					. Please try again.
				</p>
			</div>
		);
	}

	return (
		<ul role="list" {...autocomplete.getListProps()}>
			{collection.items.map((result, resultIndex) => (
				<SearchResult
					key={result.objectID}
					result={result}
					resultIndex={resultIndex}
					autocomplete={autocomplete}
					collection={collection}
				/>
			))}
		</ul>
	);
}

const SearchInput = forwardRef(function SearchInput(
	{ autocomplete, autocompleteState, onClose },
	inputRef,
) {
	let inputProps = autocomplete.getInputProps({});

	return (
		<div className="group relative flex h-12">
			<SearchIcon className="pointer-events-none absolute left-3 top-0 h-full w-5 stroke-zinc-500" />
			<input
				ref={inputRef}
				className={clsx(
					'flex-auto appearance-none bg-transparent pl-10 text-zinc-900 outline-none placeholder:text-zinc-500 focus:w-full focus:flex-none dark:text-white sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
					autocompleteState.status === 'stalled' ? 'pr-11' : 'pr-4',
				)}
				{...inputProps}
				onKeyDown={(event) => {
					if (
						event.key === 'Escape' &&
						!autocompleteState.isOpen &&
						autocompleteState.query === ''
					) {
						// In Safari, closing the dialog with the escape key can sometimes cause the scroll position to jump to the
						// bottom of the page. This is a workaround for that until we can figure out a proper fix in Headless UI.
						document.activeElement?.blur();

						onClose();
					} else {
						inputProps.onKeyDown(event);
					}
				}}
			/>
			{autocompleteState.status === 'stalled' && (
				<div className="absolute inset-y-0 right-3 flex items-center">
					<LoadingIcon className="h-5 w-5 animate-spin stroke-zinc-200 text-zinc-900 dark:stroke-zinc-800 dark:text-emerald-400" />
				</div>
			)}
		</div>
	);
});

function AlgoliaLogo(props) {
	return (
		<svg viewBox="0 0 71 16" role="img" aria-label="Algolia" {...props}>
			<path
				fillRule="evenodd"
				d="M34.98 8.81V.19a.189.189 0 0 0-.218-.186l-1.615.254a.19.19 0 0 0-.16.187l.006 8.741c0 .414 0 2.966 3.07 3.056a.19.19 0 0 0 .195-.19v-1.304a.187.187 0 0 0-.164-.187c-1.115-.128-1.115-1.522-1.115-1.75v-.002Z"
				clipRule="evenodd"
			/>
			<path d="M61.605 3.352H59.98a.189.189 0 0 0-.189.189v8.514c0 .104.085.189.189.189h1.625a.189.189 0 0 0 .188-.19V3.542a.189.189 0 0 0-.188-.189Z" />
			<path
				fillRule="evenodd"
				d="M59.98 2.285h1.625a.189.189 0 0 0 .188-.189V.19a.189.189 0 0 0-.218-.187l-1.624.255a.189.189 0 0 0-.16.186v1.652c0 .104.085.189.189.189ZM57.172 8.81V.19a.189.189 0 0 0-.218-.186l-1.615.254a.19.19 0 0 0-.16.187l.006 8.741c0 .414 0 2.966 3.07 3.056a.19.19 0 0 0 .196-.19v-1.304a.187.187 0 0 0-.164-.187c-1.115-.128-1.115-1.522-1.115-1.75v-.002ZM52.946 4.568a3.628 3.628 0 0 0-1.304-.906 4.347 4.347 0 0 0-1.666-.315c-.601 0-1.157.101-1.662.315a3.822 3.822 0 0 0-1.304.906c-.367.39-.652.86-.856 1.408-.204.55-.296 1.196-.296 1.868 0 .671.103 1.18.306 1.734.204.554.484 1.027.846 1.42.361.39.795.691 1.3.91.504.218 1.283.33 1.676.335.392 0 1.177-.122 1.686-.335.51-.214.943-.52 1.305-.91.361-.393.641-.866.84-1.42.199-.555.295-1.063.295-1.734 0-.672-.107-1.318-.32-1.868a4.203 4.203 0 0 0-.846-1.408Zm-1.421 5.239c-.367.504-.882.758-1.539.758-.657 0-1.172-.25-1.539-.758-.367-.504-.55-1.088-.55-1.958 0-.86.178-1.573.545-2.076.367-.504.882-.752 1.538-.752.658 0 1.172.248 1.539.752.367.498.556 1.215.556 2.076 0 .87-.184 1.449-.55 1.958ZM29.35 3.352H27.77c-1.547 0-2.909.815-3.703 2.051a4.643 4.643 0 0 0-.736 2.519 4.611 4.611 0 0 0 1.949 3.783 2.574 2.574 0 0 0 1.542.428l.034-.002.084-.006.032-.004.088-.011.02-.003c1.052-.163 1.97-.986 2.268-2.01v1.85c0 .105.085.19.19.19h1.612a.189.189 0 0 0 .19-.19V3.541a.189.189 0 0 0-.19-.189H29.35Zm0 6.62c-.39.326-.896.448-1.435.484l-.016.002a1.68 1.68 0 0 1-.107.003c-1.352 0-2.468-1.149-2.468-2.54 0-.328.063-.64.173-.927.36-.932 1.241-1.591 2.274-1.591h1.578v4.57ZM69.009 3.352H67.43c-1.547 0-2.908.815-3.703 2.051a4.643 4.643 0 0 0-.736 2.519 4.611 4.611 0 0 0 1.949 3.783 2.575 2.575 0 0 0 1.542.428l.034-.002.084-.006.033-.004.087-.011.02-.003c1.053-.163 1.97-.986 2.269-2.01v1.85c0 .105.084.19.188.19h1.614a.189.189 0 0 0 .188-.19V3.541a.189.189 0 0 0-.188-.189h-1.802Zm0 6.62c-.39.326-.895.448-1.435.484l-.016.002a1.675 1.675 0 0 1-.107.003c-1.352 0-2.468-1.149-2.468-2.54 0-.328.063-.64.174-.927.359-.932 1.24-1.591 2.273-1.591h1.579v4.57ZM42.775 3.352h-1.578c-1.547 0-2.909.815-3.704 2.051a4.63 4.63 0 0 0-.735 2.519 4.6 4.6 0 0 0 1.65 3.555c.094.083.194.16.298.228a2.575 2.575 0 0 0 2.966-.08c.52-.37.924-.913 1.103-1.527v1.608h-.004v.354c0 .7-.182 1.225-.554 1.58-.372.354-.994.532-1.864.532-.356 0-.921-.02-1.491-.078a.19.19 0 0 0-.2.136l-.41 1.379a.19.19 0 0 0 .155.24c.688.1 1.36.15 1.748.15 1.565 0 2.725-.343 3.484-1.03.688-.621 1.061-1.564 1.127-2.832V3.54a.189.189 0 0 0-.19-.189h-1.801Zm0 2.051s.021 4.452 0 4.587c-.386.312-.867.435-1.391.47l-.016.001a1.751 1.751 0 0 1-.233 0c-1.293-.067-2.385-1.192-2.385-2.54 0-.327.063-.64.174-.927.359-.931 1.24-1.591 2.273-1.591h1.578Z"
				clipRule="evenodd"
			/>
			<path d="M8.725.001C4.356.001.795 3.523.732 7.877c-.064 4.422 3.524 8.085 7.946 8.111a7.94 7.94 0 0 0 3.849-.96.187.187 0 0 0 .034-.305l-.748-.663a.528.528 0 0 0-.555-.094 6.461 6.461 0 0 1-2.614.513c-3.574-.043-6.46-3.016-6.404-6.59a6.493 6.493 0 0 1 6.485-6.38h6.485v11.527l-3.68-3.269a.271.271 0 0 0-.397.042 3.014 3.014 0 0 1-5.416-1.583 3.02 3.02 0 0 1 3.008-3.248 3.02 3.02 0 0 1 3.005 2.75.537.537 0 0 0 .176.356l.958.85a.187.187 0 0 0 .308-.106c.07-.37.094-.755.067-1.15a4.536 4.536 0 0 0-4.23-4.2A4.53 4.53 0 0 0 4.203 7.87c-.067 2.467 1.954 4.593 4.421 4.648a4.498 4.498 0 0 0 2.756-.863l4.808 4.262a.32.32 0 0 0 .531-.239V.304a.304.304 0 0 0-.303-.303h-7.69Z" />
		</svg>
	);
}

function SearchButton(props) {
	let [modifierKey, setModifierKey] = useState();

	useEffect(() => {
		setModifierKey(
			/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl ',
		);
	}, []);

	return (
		<>
			<button
				type="button"
				className="hidden h-8 w-full items-center gap-2 rounded-full bg-white pl-2 pr-3 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 dark:bg-white/5 dark:text-zinc-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex focus:[&:not(:focus-visible)]:outline-none"
				{...props}
			>
				<SearchIcon className="h-5 w-5 stroke-current" />
				Find something...
				<kbd className="ml-auto text-2xs text-zinc-400 dark:text-zinc-500">
					<kbd className="font-sans">{modifierKey}</kbd>
					<kbd className="font-sans">K</kbd>
				</kbd>
			</button>
			<button
				type="button"
				className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5 lg:hidden focus:[&:not(:focus-visible)]:outline-none"
				aria-label="Find something..."
				{...props}
			>
				<SearchIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
			</button>
		</>
	);
}

function SearchDialog({ open, setOpen, className }) {
	let location = useLocation();
	let formRef = useRef();
	let panelRef = useRef();
	let inputRef = useRef();
	let { autocomplete, autocompleteState } = useAutocomplete();

	useEffect(() => {
		if (!open) {
			return;
		}

		setOpen(false);
	}, [open, setOpen, location]);

	useEffect(() => {
		if (open) {
			return;
		}

		function onKeyDown(event) {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setOpen(true);
			}
		}

		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [open, setOpen]);

	return (
		<Transition.Root
			show={open}
			as={Fragment}
			afterLeave={() => autocomplete.setQuery('')}
		>
			<Dialog
				onClose={setOpen}
				className={clsx('fixed inset-0 z-50', className)}
			>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-zinc-400/25 backdrop-blur-sm dark:bg-black/40" />
				</Transition.Child>

				<div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:py-20 sm:px-6 md:py-32 lg:px-8 lg:py-[15vh]">
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<Dialog.Panel className="mx-auto overflow-hidden rounded-lg bg-zinc-50 shadow-xl ring-1 ring-zinc-900/7.5 dark:bg-zinc-900 dark:ring-zinc-800 sm:max-w-xl">
							<div {...autocomplete.getRootProps({})}>
								<form
									ref={formRef}
									{...autocomplete.getFormProps({
										inputElement: inputRef.current,
									})}
								>
									<SearchInput
										ref={inputRef}
										autocomplete={autocomplete}
										autocompleteState={autocompleteState}
										onClose={() => setOpen(false)}
									/>
									<div
										ref={panelRef}
										className="border-t border-zinc-200 bg-white empty:hidden dark:border-zinc-100/5 dark:bg-white/2.5"
										{...autocomplete.getPanelProps({})}
									>
										{autocompleteState.isOpen && (
											<>
												<SearchResults
													autocomplete={autocomplete}
													query={autocompleteState.query}
													collection={autocompleteState.collections[0]}
												/>
												<p className="flex items-center justify-end gap-2 border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
													Search by{' '}
													<AlgoliaLogo className="h-4 fill-[#003DFF] dark:fill-zinc-400" />
												</p>
											</>
										)}
									</div>
								</form>
							</div>
						</Dialog.Panel>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition.Root>
	);
}

function useSearchProps() {
	let buttonRef = useRef();
	let [open, setOpen] = useState(false);

	return {
		buttonProps: {
			ref: buttonRef,
			onClick() {
				setOpen(true);
			},
		},
		dialogProps: {
			open,
			setOpen(open) {
				let { width, height } = buttonRef.current.getBoundingClientRect();
				if (!open || (width !== 0 && height !== 0)) {
					setOpen(open);
				}
			},
		},
	};
}

export function Search() {
	let [modifierKey, setModifierKey] = useState();
	let { buttonProps, dialogProps } = useSearchProps();

	useEffect(() => {
		setModifierKey(
			/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl ',
		);
	}, []);

	return (
		<div className="hidden lg:block lg:max-w-md lg:flex-auto">
			<button
				type="button"
				className="hidden h-8 w-full items-center gap-2 rounded-full bg-white pl-2 pr-3 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 dark:bg-white/5 dark:text-zinc-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex focus:[&:not(:focus-visible)]:outline-none"
				{...buttonProps}
			>
				<SearchIcon className="h-5 w-5 stroke-current" />
				Find something...
				<kbd className="ml-auto text-2xs text-zinc-400 dark:text-zinc-500">
					<kbd className="font-sans">{modifierKey}</kbd>
					<kbd className="font-sans">K</kbd>
				</kbd>
			</button>
			<SearchDialog className="hidden lg:block" {...dialogProps} />
		</div>
	);
}

export function MobileSearch() {
	let { buttonProps, dialogProps } = useSearchProps();

	return (
		<div className="contents lg:hidden">
			<button
				type="button"
				className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5 lg:hidden focus:[&:not(:focus-visible)]:outline-none"
				aria-label="Find something..."
				{...buttonProps}
			>
				<SearchIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
			</button>
			<SearchDialog className="lg:hidden" {...dialogProps} />
		</div>
	);
}

// from Header.jsx
function TopLevelNavItemHeader({ href, children }) {
	return (
		<li>
			<Link
				to={href}
				className="text-sm leading-5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
			>
				{children}
			</Link>
		</li>
	);
}

export const Header = forwardRef(function Header({ className }, ref) {
	let { isOpen: mobileNavIsOpen } = useMobileNavigationStore();
	let isInsideMobileNavigation = useIsInsideMobileNavigation();

	let { scrollY } = useScroll();
	let bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
	let bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);

	return (
		<motion.div
			ref={ref}
			className={clsx(
				className,
				'fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-12 px-4 transition sm:px-6 lg:left-72 lg:z-30 lg:px-8 xl:left-80',
				!isInsideMobileNavigation &&
					'backdrop-blur-sm dark:backdrop-blur lg:left-72 xl:left-80',
				isInsideMobileNavigation
					? 'bg-white dark:bg-zinc-900'
					: 'bg-white/[var(--bg-opacity-light)] dark:bg-zinc-900/[var(--bg-opacity-dark)]',
			)}
			style={{
				'--bg-opacity-light': bgOpacityLight,
				'--bg-opacity-dark': bgOpacityDark,
			}}
		>
			<div
				className={clsx(
					'absolute inset-x-0 top-full h-px transition',
					(isInsideMobileNavigation || !mobileNavIsOpen) &&
						'bg-zinc-900/7.5 dark:bg-white/7.5',
				)}
			/>
			<Search />
			<div className="flex items-center gap-5 lg:hidden">
				<MobileNavigation />
				<Link className="text-zinc-400" to="/" aria-label="Home">
					Conform
				</Link>
			</div>
			<div className="flex items-center gap-5">
				<nav className="hidden md:block">
					<ul role="list" className="flex items-center gap-8">
						<TopLevelNavItemHeader href="/">API</TopLevelNavItemHeader>
						<TopLevelNavItemHeader href="#">
							Documentation
						</TopLevelNavItemHeader>
						<TopLevelNavItemHeader href="#">Support</TopLevelNavItemHeader>
					</ul>
				</nav>
				<div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900/10 md:dark:bg-white/15" />
				<div className="flex gap-4">
					<MobileSearch />
					<ModeToggle />
				</div>
				<div className="hidden min-[416px]:contents">
					<Button href="#">Sign in</Button>
				</div>
			</div>
		</motion.div>
	);
});

// from MobileNavigation.jsx
function MenuIcon(props) {
	return (
		<svg
			viewBox="0 0 10 9"
			fill="none"
			strokeLinecap="round"
			aria-hidden="true"
			{...props}
		>
			<path d="M.5 1h9M.5 8h9M.5 4.5h9" />
		</svg>
	);
}

function XIcon(props) {
	return (
		<svg
			viewBox="0 0 10 9"
			fill="none"
			strokeLinecap="round"
			aria-hidden="true"
			{...props}
		>
			<path d="m1.5 1 7 7M8.5 1l-7 7" />
		</svg>
	);
}

const IsInsideMobileNavigationContext = createContext(false);

export function useIsInsideMobileNavigation() {
	return useContext(IsInsideMobileNavigationContext);
}

export const useMobileNavigationStore = create((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export function MobileNavigation() {
	let isInsideMobileNavigation = useIsInsideMobileNavigation();
	let { isOpen, toggle, close } = useMobileNavigationStore();
	let ToggleIcon = isOpen ? XIcon : MenuIcon;

	return (
		<IsInsideMobileNavigationContext.Provider value={true}>
			<button
				type="button"
				className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
				aria-label="Toggle navigation"
				onClick={toggle}
			>
				<ToggleIcon className="w-2.5 stroke-zinc-900 dark:stroke-white" />
			</button>
			{!isInsideMobileNavigation && (
				<Transition.Root show={isOpen} as={Fragment}>
					<Dialog onClose={close} className="fixed inset-0 z-50 lg:hidden">
						<Transition.Child
							as={Fragment}
							enter="duration-300 ease-out"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="duration-200 ease-in"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<div className="fixed inset-0 top-14 bg-zinc-400/20 backdrop-blur-sm dark:bg-black/40" />
						</Transition.Child>

						<Dialog.Panel>
							<Transition.Child
								as={Fragment}
								enter="duration-300 ease-out"
								enterFrom="opacity-0"
								enterTo="opacity-100"
								leave="duration-200 ease-in"
								leaveFrom="opacity-100"
								leaveTo="opacity-0"
							>
								<Header />
							</Transition.Child>

							<Transition.Child
								as={Fragment}
								enter="duration-500 ease-in-out"
								enterFrom="-translate-x-full"
								enterTo="translate-x-0"
								leave="duration-500 ease-in-out"
								leaveFrom="translate-x-0"
								leaveTo="-translate-x-full"
							>
								<motion.div
									layoutScroll
									className="fixed left-0 top-14 bottom-0 w-full overflow-y-auto bg-white px-4 pt-6 pb-4 shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-900/7.5 dark:bg-zinc-900 dark:ring-zinc-800 min-[416px]:max-w-sm sm:px-6 sm:pb-10"
								>
									<Navigation />
								</motion.div>
							</Transition.Child>
						</Dialog.Panel>
					</Dialog>
				</Transition.Root>
			)}
		</IsInsideMobileNavigationContext.Provider>
	);
}

// from Navigation.jsx
function useInitialValue(value, condition = true) {
	let initialValue = useRef(value).current;
	return condition ? initialValue : value;
}

function TopLevelNavItem({ href, children }) {
	return (
		<li className="md:hidden">
			<Link
				to={href}
				className="block py-1 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
			>
				{children}
			</Link>
		</li>
	);
}

function NavLink({ href, tag, active, isAnchorLink = false, children }) {
	return (
		<Link
			to={href}
			aria-current={active ? 'page' : undefined}
			className={clsx(
				'flex justify-between gap-2 py-1 pr-3 text-sm transition',
				isAnchorLink ? 'pl-7' : 'pl-4',
				active
					? 'text-zinc-900 dark:text-white'
					: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
			)}
		>
			<span className="truncate">{children}</span>
			{tag && (
				<Tag variant="small" color="zinc">
					{tag}
				</Tag>
			)}
		</Link>
	);
}

function VisibleSectionHighlight({ group, pathname }) {
	let [sections, visibleSections] = useInitialValue(
		[
			useSectionStore((s) => s.sections),
			useSectionStore((s) => s.visibleSections),
		],
		useIsInsideMobileNavigation(),
	);

	let isPresent = useIsPresent();
	let firstVisibleSectionIndex = Math.max(
		0,
		[{ id: '_top' }, ...sections].findIndex(
			(section) => section.id === visibleSections[0],
		),
	);
	let itemHeight = remToPx(2);
	let height = isPresent
		? Math.max(1, visibleSections.length) * itemHeight
		: itemHeight;
	let top =
		group.menus.findIndex((link) => link.to === pathname) * itemHeight +
		firstVisibleSectionIndex * itemHeight;

	return (
		<motion.div
			layout
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { delay: 0.2 } }}
			exit={{ opacity: 0 }}
			className="absolute inset-x-0 top-0 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5"
			style={{ borderRadius: 8, height, top }}
		/>
	);
}

function ActivePageMarker({ group, pathname }) {
	let itemHeight = remToPx(2);
	let offset = remToPx(0.25);
	let activePageIndex = group.menus.findIndex((link) => link.to === pathname);
	let top = offset + activePageIndex * itemHeight;

	return (
		<motion.div
			layout
			className="absolute left-2 h-6 w-px bg-emerald-500"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { delay: 0.2 } }}
			exit={{ opacity: 0 }}
			style={{ top }}
		/>
	);
}

function NavigationGroup({ group, className }) {
	// If this is the mobile navigation then we always render the initial
	// state, so that the state does not change during the close animation.
	// The state will still update when we re-open (re-render) the navigation.
	let isInsideMobileNavigation = useIsInsideMobileNavigation();

	let [location, sections] = useInitialValue(
		[useLocation(), useSectionStore((s) => s.sections)],
		isInsideMobileNavigation,
	);

	let isActiveGroup =
		group.menus.findIndex((link) => link.to === location.pathname) !== -1;

	return (
		<li className={clsx('relative mt-6', className)}>
			<motion.h2
				layout="position"
				className="text-xs font-semibold text-zinc-900 dark:text-white"
			>
				{group.title}
			</motion.h2>
			<div className="relative mt-3 pl-2">
				<AnimatePresence initial={!isInsideMobileNavigation}>
					{isActiveGroup && (
						<VisibleSectionHighlight
							group={group}
							pathname={location.pathname}
						/>
					)}
				</AnimatePresence>
				<motion.div
					layout
					className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/5"
				/>
				<AnimatePresence initial={false}>
					{isActiveGroup && (
						<ActivePageMarker group={group} pathname={location.pathname} />
					)}
				</AnimatePresence>
				<ul role="list" className="border-l border-transparent">
					{group.menus.map((link) => (
						<motion.li key={link.to} layout="position" className="relative">
							<NavLink href={link.to} active={link.to === location.pathname}>
								{link.title}
							</NavLink>
							<AnimatePresence mode="popLayout" initial={false}>
								{link.to === location.pathname && sections.length > 0 && (
									<motion.ul
										role="list"
										initial={{ opacity: 0 }}
										animate={{
											opacity: 1,
											transition: { delay: 0.1 },
										}}
										exit={{
											opacity: 0,
											transition: { duration: 0.15 },
										}}
									>
										{sections.map((section) => (
											<li key={section.id}>
												<NavLink
													href={`${link.to}#${section.id}`}
													tag={section.tag}
													isAnchorLink
												>
													{section.title}
												</NavLink>
											</li>
										))}
									</motion.ul>
								)}
							</AnimatePresence>
						</motion.li>
					))}
				</ul>
			</div>
		</li>
	);
}

export function Navigation(props) {
	return (
		<nav {...props}>
			<ul role="list">
				<TopLevelNavItem href="/">API</TopLevelNavItem>
				<TopLevelNavItem href="#">Documentation</TopLevelNavItem>
				<TopLevelNavItem href="#">Support</TopLevelNavItem>
				{navigation.map((group, groupIndex) => (
					<NavigationGroup
						key={group.title}
						group={group}
						className={groupIndex === 0 && 'md:mt-0'}
					/>
				))}
				<li className="sticky bottom-0 z-10 mt-6 min-[416px]:hidden">
					<Button to="#" variant="filled" className="w-full">
						Sign in
					</Button>
				</li>
			</ul>
		</nav>
	);
}

export default function Guide() {
	const [navOpen, setNavOpen] = useState(false);
	const location = useLocation();

	useEffect(() => {
		setNavOpen(false);
	}, [location]);

	return (
		<SectionProvider sections={[]}>
			<div className="lg:ml-72 xl:ml-80">
				<motion.header
					layoutScroll
					className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex"
				>
					<header className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex">
						<div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pt-4 lg:pb-8 lg:dark:border-white/10 xl:w-80">
							<div className="hidden lg:flex">
								<Link className="text-zinc-400" aria-label="Home" to="/">
									Conform
								</Link>
							</div>
							<Header />
							<Navigation className="hidden lg:mt-10 lg:block" />
						</div>
					</header>
				</motion.header>
				<div className="relative px-4 pt-14 sm:px-6 lg:px-8">
					<main className="py-16">
						<article className="prose dark:prose-invert">
							<HeroPattern />
							<Outlet />
							{/* <div>test</div> */}
						</article>
					</main>
					{/* <Footer /> */}
				</div>
			</div>
		</SectionProvider>
	);
}
