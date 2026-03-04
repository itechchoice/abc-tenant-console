import { PanelLeftClose, Blocks, ChevronDown, Paperclip, Mic, Send } from 'lucide-react';

function ToolbarTag({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 h-8 px-2.5 border border-divider rounded-[10px] cursor-pointer hover:bg-gray-50 transition-colors">
      {Icon && <Icon className="size-4 text-text-secondary" />}
      <span className="text-sm leading-5 text-text-primary whitespace-nowrap">{label}</span>
    </div>
  );
}

function ChatMain() {
  return (
    <main className="flex flex-col items-center justify-center gap-10 flex-1 min-w-0 h-full bg-gray-bg relative">
      {/* Panel toggle */}
      <button className="absolute top-5 left-5 hover:opacity-70 transition-opacity">
        <PanelLeftClose className="size-5 text-text-secondary" />
      </button>

      {/* Hero Section */}
      <div className="flex flex-col items-center gap-10 text-center max-w-[748px] w-full px-6">
        <div className="flex flex-col justify-center w-full">
          <h1 className="text-[50px] font-bold leading-[60px] tracking-[-0.25px] text-text-primary">
            Type in your questions
          </h1>
          <h1 className="text-[50px] font-bold leading-[60px] tracking-[-0.25px] text-text-primary">
            {`and I'll help you~`}
          </h1>
        </div>
        <p className="text-xl leading-[22px] text-text-tertiary max-w-[654px]">
          Get intelligent insights for portfolio optimization, risk assessment,
          <br />
          and asset allocation
        </p>
      </div>

      {/* Chat Input */}
      <div className="flex flex-col items-end justify-between max-w-[880px] w-[calc(100%-48px)] h-[168px] bg-white rounded-2xl shadow-[0px_6px_12px_0px_rgba(0,0,0,0.06)] px-5 py-4">
        <textarea
          className="w-full h-[88px] text-sm leading-[22px] text-text-placeholder resize-none outline-none placeholder:text-text-placeholder font-sans"
          placeholder="Send Message or Select Skill..."
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <ToolbarTag icon={Blocks} label="Composite Tools" />
            <ToolbarTag icon={Blocks} label="Connector" />
            <div className="flex items-center gap-1.5 h-8 px-2.5 border border-divider rounded-[10px] cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-sm leading-5 text-text-primary whitespace-nowrap">gpt-4.1</span>
              <ChevronDown className="size-4 text-text-secondary" />
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button className="flex items-center justify-center size-[30px] rounded-[10px] hover:bg-gray-50 transition-colors">
              <Paperclip className="size-4 text-text-secondary" />
            </button>
            <button className="flex items-center justify-center size-[30px] rounded-[10px] hover:bg-gray-50 transition-colors">
              <Mic className="size-4 text-text-secondary" />
            </button>
            <button className="flex items-center justify-center size-8 rounded-full bg-brand hover:bg-brand/90 transition-colors">
              <Send className="size-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ChatMain;
