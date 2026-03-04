import {
  Search, Workflow, Bell, Settings,
} from 'lucide-react';
import logo from '@/assets/images/logo.svg';
import avatar from '@/assets/images/avatar.svg';

function AppRail() {
  return (
    <aside className="flex flex-col items-center justify-between shrink-0 bg-navy-900 px-4 py-5 h-full">
      <div className="flex flex-col items-start gap-5">
        <div className="size-[38px] relative">
          <img
            alt="Logo"
            className="absolute top-1/2 -translate-y-1/2 left-0 w-[38px] h-[28px]"
            src={logo}
          />
        </div>

        <nav className="flex flex-col items-start gap-3">
          <button className="flex items-center p-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Search className="size-5 text-white/80" />
          </button>
          <button className="flex items-center p-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Workflow className="size-5 text-white/80" />
          </button>
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <div className="relative">
          <button className="flex items-center p-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className="size-5 text-white" />
          </button>
          <span className="absolute size-[5px] top-2.5 right-2 bg-red-500 rounded-full" />
        </div>

        <button className="flex items-center p-2.5 rounded-lg hover:bg-white/10 transition-colors">
          <Settings className="size-5 text-white/80" />
        </button>

        <img alt="Avatar" className="size-8 rounded-full" src={avatar} />
      </div>
    </aside>
  );
}

export default AppRail;
