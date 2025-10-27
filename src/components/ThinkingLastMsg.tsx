import type {AiMsg, ToolMsg} from "./Chat.tsx";
import MsgBox from "./MsgBox.tsx";



export function RenderThinkingLastMsg(lastAiMsg: AiMsg | null, setShowThinking: (value: (((prevState: boolean) => boolean) | boolean)) => void, showThinking: boolean, toolMsg: ToolMsg[] | null) {

    function formatToolMsg(): string {
        if(toolMsg == null) {
            return "";
        }
        const msgsAsMap = toolMsg.reduce((acc, {document_name, page_number}) => {
            if (!acc.has(document_name)) {
                acc.set(document_name, []);
            }
            acc.get(document_name)!.push(page_number);
            return acc;
        }, new Map<string, number[]>());

        return "Found text matching in the following documents and pages: " + Array.from(msgsAsMap.entries())
            .map(([name, pages]) =>
                `- **${name}** → pages ${[...pages].sort((a, b) => a - b).join(", ")}`
            )
            .join("\n");
    }

    return <>
        {lastAiMsg != null && (<div className="mt-2">
                <button
                    type="button"
                    onClick={() => setShowThinking(!showThinking)}
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200"
                    aria-expanded={showThinking}
                >
                    <span>🧠 {showThinking ? "Hide reasoning" : "Show reasoning"}</span>
                </button>

                {showThinking && lastAiMsg.thinkingContent.length > 0 && (
                    <div>
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <MsgBox html={lastAiMsg.thinkingContent}/>
                        </div>
                        {toolMsg != null && toolMsg.length > 0 ? <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <MsgBox html={formatToolMsg()}/>
                        </div> : null}
                    </div>
                )}
            </div>
        )}
    </>;
}
