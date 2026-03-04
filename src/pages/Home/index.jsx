import AppRail from '@/components/AppRail';
import Sidebar from '@/components/Sidebar';
import ChatMain from '@/components/ChatMain';

function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      <AppRail />
      <Sidebar />
      <ChatMain />
    </div>
  );
}

export default Home;
