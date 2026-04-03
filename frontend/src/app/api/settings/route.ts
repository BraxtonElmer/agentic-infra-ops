import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    integrations: {
      repos: [
        { id: 'r1', name: 'axiom-api', url: 'github.com/axiom-labs/axiom-api', status: 'connected' },
        { id: 'r2', name: 'frontend-app', url: 'github.com/axiom-labs/frontend-app', status: 'connected' },
        { id: 'r3', name: 'infra-deploy', url: 'github.com/axiom-labs/infra-deploy', status: 'connected' },
        { id: 'r4', name: 'ml-pipeline', url: 'github.com/axiom-labs/ml-pipeline', status: 'syncing' },
      ],
      servers: [
        { id: 'sv1', name: 'prod-worker-01', host: '10.0.1.10', status: 'connected' },
        { id: 'sv2', name: 'prod-worker-02', host: '10.0.1.11', status: 'connected' },
        { id: 'sv3', name: 'prod-worker-03', host: '10.0.1.12', status: 'connected' },
        { id: 'sv4', name: 'gpu-training-01', host: '10.0.2.20', status: 'connected' },
      ],
    },
    llm: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      models: {
        groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        ollama: ['llama3.2', 'codellama', 'mistral'],
        gemini: ['gemini-2.5-pro', 'gemini-2.0-flash'],
      },
    },
    thresholds: {
      cpuWarning: 70,
      cpuCritical: 90,
      ramWarning: 75,
      ramCritical: 90,
      diskWarning: 80,
    },
    agentBehavior: {
      mode: 'suggest',
      autoOpenPRs: true,
      autoTerminateStale: false,
      webhookUrl: 'https://hooks.axiom.dev/agent-events',
    },
  });
}
