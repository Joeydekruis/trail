import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#0a0f1a] text-[#e2e8f0] flex items-center justify-center">
        <h1 className="text-2xl font-bold">Trail UI</h1>
      </div>
    </QueryClientProvider>
  );
}
