import { AIChat } from "@/features/ai/components/ai-chat";

export default function AIPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card px-6 py-4">
        <h2 className="text-h4 font-bold text-foreground">AI Assistant</h2>
        <p className="text-small text-muted-foreground mt-0.5">
          Ask questions about your farm operations.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChat />
      </div>
    </div>
  );
}
