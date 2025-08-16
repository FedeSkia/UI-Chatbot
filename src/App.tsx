import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL as string;

function App() {
  const [input, setInput] = useState("hello");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setOutput("");
    setLoading(true);
    const response = await fetch(API_URL + "/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: input }),
    });

    if (!response.body) {
      console.error("No response body received");
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setOutput((prev) => prev + chunk);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Test Streaming da FastAPI</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Scrivi qualcosa..."
        style={{ width: "300px", marginRight: "1rem" }}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? "In ascolto..." : "Invia"}
      </button>

      <h3>Risposta in streaming:</h3>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "1rem",
          minHeight: "150px",
          whiteSpace: "pre-wrap",
        }}
      >
        {output}
      </pre>
    </div>
  );
}

export default App;
