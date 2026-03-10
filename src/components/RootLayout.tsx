import { Outlet } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle';

function RootLayout() {
  useDocumentTitle();
  return <Outlet />;
}

export default RootLayout;
