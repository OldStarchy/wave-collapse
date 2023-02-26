import { RefObject, useEffect, useMemo, useState } from 'react';

export function useResize(
	element: RefObject<HTMLElement>,
): { width: number; height: number } | undefined {
	const [size, setSize] = useState<{ width: number; height: number }>();

	const resizeObserver = useMemo(() => {
		if (typeof ResizeObserver !== 'undefined') {
			return new ResizeObserver((entries: ResizeObserverEntry[]) => {
				const entry = entries[0];
				const { width, height } = entry.contentRect;

				setSize((size) => {
					if (size && size.width === width && size.height === height)
						return size;

					return { width, height };
				});
			});
		}
	}, []);

	useEffect(() => {
		if (element.current && resizeObserver) {
			const el = element.current;

			setSize({
				width: el.clientWidth,
				height: el.clientHeight,
			});

			resizeObserver.observe(el);
			return () => {
				resizeObserver.unobserve(el);
			};
		}
	}, [resizeObserver, element]);

	return size;
}
