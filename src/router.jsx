import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home/index';
import Login from './pages/Login/index';
import NotFound from './pages/NotFound/index';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
