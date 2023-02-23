import { RefObject, useEffect, useMemo } from 'react';

export function useResize(
	element: RefObject<HTMLElement>,
	callback: (entries: ResizeObserverEntry[]) => void,
) {
	const resizeObserver = useMemo(() => {
		if (typeof ResizeObserver !== 'undefined') {
			return new ResizeObserver((entries: ResizeObserverEntry[]) => {
				callback(entries);
			});
		}
	}, [callback]);

	useEffect(() => {
		if (element.current && resizeObserver) {
			const el = element.current;

			resizeObserver.observe(el);
			return () => {
				resizeObserver.unobserve(el);
			};
		}
	}, [resizeObserver, element]);
}
