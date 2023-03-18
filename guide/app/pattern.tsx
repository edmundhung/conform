import { type MotionValue, motion, useMotionTemplate } from 'framer-motion';
import { useId } from 'react';

interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
	squares?: Array<[number, number]>;
}

export function GridPattern({
	width,
	height,
	x,
	y,
	squares,
	...props
}: GridPatternProps) {
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
							width={Number(width) + 1}
							height={Number(height) + 1}
							x={x * Number(width)}
							y={y * Number(height)}
						/>
					))}
				</svg>
			)}
		</svg>
	);
}

interface ResourcePatternProps extends GridPatternProps {
	mouseX: MotionValue;
	mouseY: MotionValue;
}

export function ResourcePattern({
	mouseX,
	mouseY,
	...gridProps
}: ResourcePatternProps) {
	let maskImage = useMotionTemplate`radial-gradient(180px at ${mouseX}px ${mouseY}px, white, transparent)`;
	let style = { maskImage, WebkitMaskImage: maskImage };

	return (
		<div className="pointer-events-none">
			<div className="absolute inset-0 rounded-2xl transition duration-300 [mask-image:linear-gradient(white,transparent)] group-hover:opacity-50">
				<GridPattern
					width={72}
					height={56}
					x="50%"
					className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/[0.02] stroke-black/5 dark:fill-white/1 dark:stroke-white/2.5"
					{...gridProps}
				/>
			</div>
			<motion.div
				className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D7EDEA] to-[#F4FBDF] opacity-0 transition duration-300 group-hover:opacity-100 dark:from-[#202D2E] dark:to-[#303428]"
				style={style}
			/>
			<motion.div
				className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay transition duration-300 group-hover:opacity-100"
				style={style}
			>
				<GridPattern
					width={72}
					height={56}
					x="50%"
					className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/50 stroke-black/70 dark:fill-white/2.5 dark:stroke-white/10"
					{...gridProps}
				/>
			</motion.div>
		</div>
	);
}
