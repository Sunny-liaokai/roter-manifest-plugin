import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Router, RouterProvider } from '@qude/router';
import { routes } from '@/router';
import Layout from '@/components/Layout';

const router = new Router({
  url: new URL(window.location.href),
  routes,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
});

(async () => {
  // @ts-expect-error 未确定 API，暂时使用内部方法
  await router.__loadLazy();

  const App = () => {
    return (
      <RouterProvider router={router}>
        <Layout />
      </RouterProvider>
    );
  };

  ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
    <App />,
  );
})();
