import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/sync`, { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Success', description: data.message });
      } else {
        toast({
          title: 'Error',
          description: data.details || 'Sync failed. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Sync failed. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
        <header className="w-full max-w-5xl text-sm font-mono">
          <h1 className="text-3xl font-semibold text-center">
            {" "}
            <code className="mb-6 text-4xl font-bold">Dashboard</code>
          </h1>
        </header>
        <div className="m-4">
          <button
            onClick={handleSync}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Syncing...' : 'Start Sync'}
          </button>
          <div id="syncStatus"></div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
