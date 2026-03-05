import ConversationSidebar from './components/ConversationSidebar';
import ChatPanel from './components/ChatPanel';

/**
 * Home – default landing page after login.
 *
 * Split-screen layout: conversation history on the left, chat interface on
 * the right.  Both panels fetch data independently with their own loading
 * skeleton states (parallel requests, no mutual blocking).
 */
function Home() {
  return (
    <div className="flex min-h-dvh bg-background">
      <ConversationSidebar />
      <ChatPanel />
    </div>
  );
}

export default Home;
