import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/RootLayout';
import App from './App';
import Home from './pages/Home/index';
import Login from './pages/Login/index';
import NotFound from './pages/NotFound/index';

const basename = import.meta.env.BASE_URL === '/'
  ? '/'
  : import.meta.env.BASE_URL.replace(/\/$/, '');

const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        {
          path: '/login',
          element: <Login />,
          handle: { title: 'Sign In' },
        },
        {
          path: '/',
          element: <App />,
          children: [
            { index: true, element: <Home />, handle: { title: 'Home' } },
            { path: '*', element: <NotFound />, handle: { title: 'Page Not Found' } },
          ],
        },
      ],
    },
  ],
  { basename },
);

export default router;
