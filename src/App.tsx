import { Outlet } from 'react-router-dom';
import AppSidebar from './components/AppSidebar';

function App() {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <AppSidebar />
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
