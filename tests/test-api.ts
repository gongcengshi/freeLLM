import 'dotenv/config';

const BASE_URL = 'http://localhost:3001';
const PROXY_API_KEY = process.env.PROXY_API_KEY || 'freellm-VHEQQvjqRj77uGf2YtUSylcrN7_q2qbA';

async function testHealth(): Promise<void> {
  console.log('Testing health endpoint...');
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  console.log('Health:', data);
  console.log('');
}

async function testChatCompletion(): Promise<void> {
  console.log('Testing chat completion...');
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROXY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'groq/llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: 'Say "Hello from FreeLLM!" in one sentence.' },
      ],
      max_tokens: 50,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.log('Error:', error);
    return;
  }

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('');
}

async function testAdminProviders(): Promise<void> {
  console.log('Testing admin providers...');
  const response = await fetch(`${BASE_URL}/admin/providers`);
  const data = await response.json();
  console.log('Providers:', (data as any[]).map(p => p.id).join(', '));
  console.log('');
}

async function main(): Promise<void> {
  await testHealth();
  await testAdminProviders();
  await testChatCompletion();
}

main().catch(console.error);
