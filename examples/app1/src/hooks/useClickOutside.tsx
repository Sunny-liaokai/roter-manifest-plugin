import { RefObject, useEffect } from 'react';

function useClickOutside(
  refs: RefObject<HTMLElement> | RefObject<HTMLElement>[],
  handler: (event: MouseEvent | Event) => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (Array.isArray(refs)) {
        const result = refs.some((ref) => {
          if (
            !ref.current ||
            ref.current.contains(event.target as HTMLElement)
          ) {
            return true;
          }
        });

        return !result && handler(event);
      }

      if (!refs.current || refs.current.contains(event.target as HTMLElement)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('click', listener);

    return () => {
      document.removeEventListener('click', listener);
    };
  }, [refs, handler]);
}

export default useClickOutside;
