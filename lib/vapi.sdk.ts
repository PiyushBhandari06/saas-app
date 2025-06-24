import Vapi from "@vapi-ai/web";

// Check if the token exists
const vapiToken = process.env.NEXT_PUBLIC_WEB_TOKEN;

if (!vapiToken) {
    console.error('NEXT_PUBLIC_WEB_TOKEN is not set in environment variables');
    throw new Error('Vapi token is required');
}

console.log('Initializing Vapi with token:', vapiToken.substring(0, 10) + '...');

export const vapi = new Vapi(vapiToken);