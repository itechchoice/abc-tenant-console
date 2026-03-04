import { ChevronDown, ChevronRight, Plus, Blocks } from 'lucide-react';
import workspaceBg from '@/assets/images/workspace-bg.png';
import airbnbOuter from '@/assets/images/airbnb-outer.svg';
import airbnbInner from '@/assets/images/airbnb-inner.svg';
import figmaIcon from '@/assets/images/figma-icon.svg';

const CHAT_HISTORY = [
  { id: 1, label: 'Portfolio optimization', active: true },
  { id: 2, label: 'Risk assessment' },
  { id: 3, label: 'Asset allocation' },
  { id: 4, label: 'Total Hard Breach Weight' },
  { id: 5, label: '+Level 1 Guard Rails' },
  { id: 6, label: 'Asset allocation' },
  { id: 7, label: 'Get intelligent' },
  { id: 8, label: 'Asset allocation' },
  { id: 9, label: 'Send Message or Select Skill', truncate: true },
  { id: 10, label: 'Send Message or Select Skill', truncate: true },
  { id: 11, label: 'Send Message or Select Skill', truncate: true },
  { id: 12, label: 'Send Message or Select Skill', truncate: true },
  { id: 13, label: 'Asset allocation' },
];

const COMPOSITE_TOOLS = [
  'Portfolio optimization',
  'Risk management',
  'Asset allocation',
];

const CONNECTORS = [
  { name: 'Airbnb', icon: airbnbInner, dot: 'bg-blue-500' },
  { name: 'Figma', icon: figmaIcon, dot: 'bg-purple-400' },
  { name: 'Jira', icon: figmaIcon, dot: 'bg-purple-400' },
];

function SectionDivider() {
  return (
    <div className="relative h-5 w-[196px]">
      <div className="absolute top-2.5 left-0 right-0 h-px bg-divider" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-5 bg-white rounded-full">
        <ChevronDown className="size-4 text-text-tertiary" />
      </div>
    </div>
  );
}

function ToolSection({ title, children }) {
  return (
    <div className="bg-gray-50 flex flex-col gap-3 items-start px-4 py-3 rounded-lg w-[228px]">
      <div className="flex items-center justify-between rounded-lg w-[196px]">
        <span className="text-xs leading-[18px] text-text-tertiary">{title}</span>
        <button className="flex items-center">
          <ChevronRight className="size-5 text-brand" />
        </button>
      </div>
      {children}
      <SectionDivider />
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="relative flex flex-col shrink-0 w-[260px] h-full bg-white border-r border-divider pt-5 pb-4 overflow-hidden">
      {/* Workspace Switcher */}
      <div className="shrink-0 flex justify-center mb-5">
        <div className="relative flex items-center justify-between px-3 py-4 rounded-[10px] overflow-hidden w-[240px]">
          <img
            alt=""
            className="absolute inset-0 size-full object-cover rounded-[10px]"
            src={workspaceBg}
          />
          <div className="absolute inset-0 bg-black/8 rounded-[10px]" />
          <span className="relative font-bold text-base leading-6 text-white">
            Marketing Campaign...
          </span>
          <button className="relative flex items-center justify-center size-6 rounded-full bg-white/20">
            <ChevronRight className="size-4 text-white" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="shrink-0 flex justify-center mb-5">
        <button className="flex items-center justify-center gap-2 w-[228px] h-10 bg-brand text-white rounded-lg px-4 py-1.5 hover:bg-brand/90 transition-colors">
          <Plus className="size-5" />
          <span className="text-base leading-6">New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 mb-5 flex justify-center">
        <div className="flex flex-col gap-0.5 w-[228px]">
          {CHAT_HISTORY.map((chat) => (
            <button
              key={chat.id}
              className={`flex items-center px-3 py-2 rounded-lg w-full h-10 text-left transition-colors shrink-0 ${
                chat.active
                  ? 'bg-gray-50 text-text-primary font-medium'
                  : 'bg-white text-text-secondary hover:bg-gray-50/60'
              }`}
            >
              <span
                className={`text-base leading-6 ${chat.truncate ? 'truncate w-[204px]' : ''}`}
              >
                {chat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Tool Sections */}
      <div className="shrink-0 flex flex-col gap-3 items-center px-4">
        <ToolSection title="Composite Tools">
          {COMPOSITE_TOOLS.map((tool) => (
            <div key={tool} className="flex items-center gap-3 rounded-lg w-full">
              <Blocks className="size-5 text-text-secondary shrink-0" />
              <span className="text-sm leading-6 text-text-primary">{tool}</span>
            </div>
          ))}
        </ToolSection>

        <ToolSection title="Connector Hub">
          {CONNECTORS.map((connector) => (
            <div
              key={connector.name}
              className="flex items-center justify-between rounded-lg w-[196px]"
            >
              <div className="flex items-center gap-3">
                <div className="relative overflow-hidden size-6">
                  <img alt="" className="absolute inset-[4.17%] size-[91.66%]" src={airbnbOuter} />
                  <img alt="" className="absolute inset-1/4 size-1/2" src={connector.icon} />
                </div>
                <span className="text-sm leading-6 text-text-primary">{connector.name}</span>
              </div>
              <span className={`size-2 rounded-full ${connector.dot}`} />
            </div>
          ))}
        </ToolSection>
      </div>

      {/* Scrollbar indicator */}
      <div className="absolute right-[3px] top-1/2 -translate-y-1/2 w-1.5 h-[50px] bg-divider-strong rounded-lg" />
    </aside>
  );
}

export default Sidebar;
