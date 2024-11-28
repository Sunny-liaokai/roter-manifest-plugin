import type { RouterItem } from '@qude/router';
export const routes: RouterItem[] = [
  {
    path: '/',
    lazy: () => import('../pages/Home'),
    // component: Home
  },
  {
    path: '/home',
    lazy: () => import('../pages/Home'),
    // component: Home
  },
  {
    path: '/home/:category',
    lazy: () => import('../pages/Detail'),
    // component: Detail,
  },
  {
    path: '/home/:category/:id',
    lazy: () => import('../pages/About'),
    // component: Detail,
  },
  {
    path: '/about',
    lazy: () => import('../pages/About'),
    // component: Detail,
  },
];
