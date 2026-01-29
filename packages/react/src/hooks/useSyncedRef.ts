import { type RefObject, useEffect, useRef } from 'react';

/** Creates a ref that stays synchronized with a value. */
export function useSyncedRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
