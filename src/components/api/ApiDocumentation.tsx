import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { BookOpen, Code, Copy, Check } from 'lucide-react';

interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
}

const API_EXAMPLES: CodeExample[] = [
  {
    title: 'Get All Memories',
    description: 'Retrieve a list of public memories with pagination',
    language: 'bash',
    code: `curl -X GET "https://api.memoriaeterna.com/api/public/memories" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
  },
  {
    title: 'Get Memory by ID',
    description: 'Retrieve a specific memory with all its details',
    language: 'bash',
    code: `curl -X GET "https://api.memoriaeterna.com/api/public/memories/MEMORY_ID" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
  },
  {
    title: 'Filter Memories by Type',
    description: 'Get memories filtered by type (PHOTO, VIDEO, MESSAGE, etc.)',
    language: 'bash',
    code: `curl -X GET "https://api.memoriaeterna.com/api/public/memories?type=PHOTO" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
  },
  {
    title: 'Get Leaderboard',
    description: 'Retrieve the gamification leaderboard',
    language: 'bash',
    code: `curl -X GET "https://api.memoriaeterna.com/api/gamification/leaderboard" \\
  -H "Content-Type: application/json"`
  },
  {
    title: 'JavaScript Example',
    description: 'Using the API with JavaScript fetch',
    language: 'javascript',
    code: `const response = await fetch('https://api.memoriaeterna.com/api/public/memories', {
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`
  }
];

export function ApiDocumentation() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          API Documentation
        </h2>
        <p className="text-gray-600 mt-1">
          Learn how to integrate with our public API
        </p>
      </div>

      <div className="space-y-8">
        {/* Authentication */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Authentication</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              All API requests require an API key to be included in the header:
            </p>
            <code className="text-sm bg-white px-3 py-2 rounded border">
              x-api-key: YOUR_API_KEY
            </code>
          </div>
        </section>

        {/* Base URL */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Base URL</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <code className="text-sm bg-white px-3 py-2 rounded border">
              https://api.memoriaeterna.com
            </code>
          </div>
        </section>

        {/* Rate Limits */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Limits</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              API requests are limited based on your plan:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Free: 100 requests/hour</li>
              <li>• Basic: 1,000 requests/hour</li>
              <li>• Pro: 10,000 requests/hour</li>
              <li>• Enterprise: Custom limits</li>
            </ul>
          </div>
        </section>

        {/* Endpoints */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Endpoints</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono">GET</span>
                <code className="text-sm font-mono">/api/public/memories</code>
              </div>
              <p className="text-sm text-gray-600">Get a list of public memories</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono">GET</span>
                <code className="text-sm font-mono">/api/public/memories/{'{id}'}</code>
              </div>
              <p className="text-sm text-gray-600">Get a specific memory by ID</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono">GET</span>
                <code className="text-sm font-mono">/api/gamification/leaderboard</code>
              </div>
              <p className="text-sm text-gray-600">Get the gamification leaderboard</p>
            </div>
          </div>
        </section>

        {/* Query Parameters */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Parameters</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <code className="text-sm font-mono">page</code>
              <span className="text-sm text-gray-600">Page number (default: 1)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <code className="text-sm font-mono">limit</code>
              <span className="text-sm text-gray-600">Items per page (max: 100)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <code className="text-sm font-mono">type</code>
              <span className="text-sm text-gray-600">Filter by memory type</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <code className="text-sm font-mono">category</code>
              <span className="text-sm text-gray-600">Filter by category ID</span>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Code Examples
          </h3>
          <div className="space-y-4">
            {API_EXAMPLES.map((example, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">{example.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{example.description}</p>
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(example.code)}
                    className="absolute top-2 right-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    {copiedCode === example.code ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Response Format */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Format</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}`}
            </pre>
          </div>
        </section>

        {/* Error Handling */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Error Handling</h3>
          <div className="space-y-3">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">401 Unauthorized</h4>
              <p className="text-sm text-red-700">Invalid or missing API key</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">429 Too Many Requests</h4>
              <p className="text-sm text-red-700">Rate limit exceeded</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">404 Not Found</h4>
              <p className="text-sm text-red-700">Resource not found</p>
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
}
