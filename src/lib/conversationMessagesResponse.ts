import {getToken} from "./auth.ts";
import {refreshToken} from "./refreshToken.ts";

const API_URL = import.meta.env.VITE_API_URL as string;

export type UserConversationThreadsResponse = {
    ok: boolean,
    error: string,
    threads: UserConversationThread[]
}

export type UserConversationThread = {
    "thread_id": string,
    "created_at": string,
    "updated_at": string
}

export type ConversationMessage = {
    type: string;
    content: string;
};

export type ConversationMessagesResponse = {
    ok: boolean;
    error: string;
    messages: ConversationMessage[];
};

export async function getUserThreads(): Promise<UserConversationThreadsResponse> {
    try {

        const res = await fetch(`${API_URL}/api/chat/get_user_conversation_history`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json",
            }
        });

        if(res.status !== 200) {
            const refreshTokenResponse = await refreshToken();
            if( refreshTokenResponse.ok ) {
                return getUserThreads()
            }
            return {ok: false, error: "Unauthenticated", threads: []}
        }

        const threads = await res.json();
        return {
            ok: true,
            error: "",
            threads: threads
        };

    } catch (e: any) {
        return {ok: false, error: e?.message, threads: []};
    }
}

export async function getConversationData(threadId: string): Promise<ConversationMessagesResponse> {
    try {
        if (!threadId) return {ok: false, error: "No threadId provided", messages: []};

        const res = await fetch(`${API_URL}/api/chat/get_user_conversation_thread`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json",
                "X-Thread-Id": threadId
            }
        });
        if(res.status !== 200) {
            const refreshTokenResponse = await refreshToken();
            if( refreshTokenResponse.ok ) {
                return getConversationData(threadId)
            }
            return {ok: false, error: "Unauthenticated", messages: []}
        }
        const data = await res.json();
        const messages: ConversationMessage[] = Array.isArray(data) ? data : JSON.parse(data);
        return {
            ok: true,
            error: "",
            messages
        };
    } catch (e: any) {
        return {ok: false, error: e?.message, messages: []};
    }
}