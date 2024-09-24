import AdminPanel from "./components/AdminPanel";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Law Admin Panel</h1>
      <AdminPanel />
    </main>
  );
}
