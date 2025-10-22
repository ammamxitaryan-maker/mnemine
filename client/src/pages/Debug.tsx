"use client";

import { useEffect, useState } from 'react';

const Debug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      // Environment variables
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,

      // Window info
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,

      // Local storage
      testUser: localStorage.getItem('testUser'),
      telegram_init_data: localStorage.getItem('telegram_init_data'),

      // WebSocket test
      websocketSupported: typeof WebSocket !== 'undefined',

      // API test
      apiTest: null
    };

    // Test API
    fetch('http://localhost:10112/api/health')
      .then(res => res.json())
      .then(data => {
        setDebugInfo({ ...info, apiTest: data });
      })
      .catch(err => {
        setDebugInfo({ ...info, apiTest: { error: err.message } });
      });
  }, []);

  const testWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:10112/ws?type=userstats&token=anonymous');
      ws.onopen = () => {
        console.log('WebSocket connected!');
        ws.close();
      };
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket test failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              VITE_BACKEND_URL: debugInfo.VITE_BACKEND_URL,
              NODE_ENV: debugInfo.NODE_ENV,
              MODE: debugInfo.MODE
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Window Info</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              hostname: debugInfo.hostname,
              protocol: debugInfo.protocol,
              port: debugInfo.port
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Local Storage</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              testUser: debugInfo.testUser,
              telegram_init_data: debugInfo.telegram_init_data
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">API Test</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.apiTest, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">WebSocket Test</h2>
          <button
            onClick={testWebSocket}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Test WebSocket Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Debug;
