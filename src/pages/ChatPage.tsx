import Chat from "../components/Chat"; // if you created it earlier
const API_URL = import.meta.env.VITE_API_URL as string;

export default function ChatPage() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">Chat</h2>
            <Chat apiUrl={API_URL} />
        </section>
    );
}