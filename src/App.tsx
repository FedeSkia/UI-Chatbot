import Chat from "./Chat";
const API_URL = import.meta.env.VITE_API_URL as string;

export default function App() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0d10] dark:text-white font-sans">
            {/* … your header/hero … */}

            {/* Replace the plain streaming test box with the chat UI */}
            <section className="mx-auto max-w-7xl px-4 pb-20">
                <h2 className="text-2xl font-bold mb-4">Chat</h2>
                <Chat apiUrl={API_URL} />
            </section>

            {/* … your features/footer … */}
        </div>
    );
}