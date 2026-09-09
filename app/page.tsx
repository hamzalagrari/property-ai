import Sidebar from "@/components/dashboard/Sidebar";
import Chat from "@/components/chat/Chat";

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <section className="flex-1">
        <Chat />
      </section>
    </main>
  );
}