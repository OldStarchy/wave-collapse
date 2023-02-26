import { useEffect } from 'react';

/**
 * Given an object of values, logs a message to the console whenever any of the
 * values change.
 * @deprecated For debugging only
 */
export function useChangeTracker(values: any) {
	for (const [key, value] of Object.entries(values)) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useEffect(() => {
			console.log(`[${key}] changed`);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [value]);
	}
}
