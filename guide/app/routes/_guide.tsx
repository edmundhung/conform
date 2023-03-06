import { Outlet, useLocation } from '@remix-run/react';
import {
	useEffect,
	useState,
	useRef,
	forwardRef,
	createContext,
	Fragment,
	useContext,
	useLayoutEffect,
} from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { create, createStore, useStore } from 'zustand';

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
	let Component = props.href ? 'a' : 'button';

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

// from header.jsx

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
								{/* <Header /> */}
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
			<a
				href={href}
				className="block py-1 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
			>
				{children}
			</a>
		</li>
	);
}

function NavLink({ href, tag, active, isAnchorLink = false, children }) {
	return (
		<a
			href={href}
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
		</a>
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

	let [router, sections] = useInitialValue(
		[useLocation(), useSectionStore((s) => s.sections)],
		isInsideMobileNavigation,
	);

	let isActiveGroup =
		group.menus.findIndex((link) => link.to === router.pathname) !== -1;

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
						<VisibleSectionHighlight group={group} pathname={router.pathname} />
					)}
				</AnimatePresence>
				<motion.div
					layout
					className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/5"
				/>
				<AnimatePresence initial={false}>
					{isActiveGroup && (
						<ActivePageMarker group={group} pathname={router.pathname} />
					)}
				</AnimatePresence>
				<ul role="list" className="border-l border-transparent">
					{group.menus.map((link) => (
						<motion.li key={link.to} layout="position" className="relative">
							<NavLink href={link.to} active={link.to === router.pathname}>
								{link.title}
							</NavLink>
							<AnimatePresence mode="popLayout" initial={false}>
								{link.to === router.pathname && sections.length > 0 && (
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
					<Button href="#" variant="filled" className="w-full">
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
								<a aria-label="Home" href="/">
									Conform
								</a>
								{/* <Header /> */}
								<Navigation className="hidden lg:mt-10 lg:block" />
							</div>
						</div>
					</header>
				</motion.header>
				<div className="relative px-4 pt-14 sm:px-6 lg:px-8">
					<main className="py-16">
						{/* <Prose as="article">{children}</Prose> */}
					</main>
					{/* <Footer /> */}
				</div>
			</div>
		</SectionProvider>
	);
}
