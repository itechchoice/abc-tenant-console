import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/RootLayout';
import App from './App';
import Home from './pages/Home/index';
import Login from './pages/Login/index';
import NotFound from './pages/NotFound/index';
import MCPManager from './pages/MCPManager/index';
import ModelManager from './pages/ModelManager/index';
import TokenQuota from './pages/TokenQuota/index';
import Profile from './pages/Profile/index';
import WorkflowList from './pages/WorkflowList/index';
import WorkflowEditor from './pages/WorkflowEditor/index';
import ConnectorAuthCallback from './pages/ConnectorAuthCallback/index';

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
          // OAuth2 callback — standalone page, outside the main App layout
          path: '/connector-auth-callback',
          element: <ConnectorAuthCallback />,
          handle: { title: 'Authorization' },
        },
        {
          path: '/',
          element: <App />,
          children: [
            { index: true, element: <Home />, handle: { title: 'Home' } },
            { path: 'mcp-manager', element: <MCPManager />, handle: { title: 'MCP Manager' } },
            { path: 'model-manager', element: <ModelManager />, handle: { title: 'Model Manager' } },
            { path: 'token-quota', element: <TokenQuota />, handle: { title: 'Token Quota' } },
            { path: 'profile', element: <Profile />, handle: { title: 'Profile' } },
            { path: 'workflows', element: <WorkflowList />, handle: { title: 'Workflows' } },
            { path: 'workflow-editor/:id', element: <WorkflowEditor />, handle: { title: 'Workflow Editor' } },
            { path: '*', element: <NotFound />, handle: { title: 'Page Not Found' } },
          ],
        },
      ],
    },
  ],
  { basename },
);

export default router;
