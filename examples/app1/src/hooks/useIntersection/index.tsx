import {
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type UseIntersectionObserverProps = Pick<
  IntersectionObserverInit,
  'rootMargin' | 'root'
>;

interface IObserverProps extends UseIntersectionObserverProps {
  rootRef?: RefObject<HTMLElement | null> | null;
  elementRef: RefObject<HTMLDivElement>;
}

type ObserveCallback = (isVisible: boolean) => void;
type Identifier = {
  root: Element | Document | null;
  margin: string;
};
type Observer = {
  id: Identifier;
  observer: IntersectionObserver;
  elements: Map<Element, ObserveCallback>;
};
const hasIntersectionObserver = typeof IntersectionObserver === 'function';
const observers = new Map<Identifier, Observer>();
const idList: Identifier[] = [];

function createObserver(options: UseIntersectionObserverProps): Observer {
  const id = {
    root: options.root || null,
    margin: options.rootMargin || '',
  };

  const existing = idList.find(
    (obj) => obj.root === id.root && obj.margin === id.margin,
  );

  let instance: Observer | undefined;

  if (existing) {
    instance = observers.get(existing);

    if (instance) {
      return instance;
    }
  }

  const elements = new Map<Element, ObserveCallback>();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const callback = elements.get(entry.target);
      const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;

      if (callback && isVisible) {
        callback(isVisible);
      }
    });
  }, options);

  instance = {
    id,
    observer,
    elements,
  };

  idList.push(id);
  observers.set(id, instance);

  return instance;
}

function observe(
  element: Element,
  callback: ObserveCallback,
  options: UseIntersectionObserverProps,
): () => void {
  const { id, observer, elements } = createObserver(options);
  elements.set(element, callback);

  observer.observe(element);

  return function unobserve(): void {
    elements.delete(element);
    observer.unobserve(element);

    // 当没有什么可看的时候摧毁观察者：
    if (elements.size === 0) {
      observer.disconnect();
      observers.delete(id);

      const index = idList.findIndex(
        (obj) => obj.root === id.root && obj.margin === id.margin,
      );

      if (index > -1) {
        idList.splice(index, 1);
      }
    }
  };
}

function useIntersectionObserver<T extends Element>({
  rootRef,
  elementRef,
  rootMargin,
}: IObserverProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasIntersectionObserver) return;
    if (visible) return;
    const element = elementRef.current;

    if (element && element.tagName) {
      const unobserve = observe(
        element,
        (isVisible) => isVisible && setVisible(isVisible),
        { root: rootRef?.current, rootMargin },
      );

      return unobserve;
    }
  }, [rootMargin, visible]);

  return [visible];
}

export default useIntersectionObserver;
