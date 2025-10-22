"use client";

import { useEffect, useState } from 'react';

const TestAuth = () => {
  const [authState, setAuthState] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAuth = async () => {
      try {
        // Test 1: Check if we're in local dev
        const isLocalDev = window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';

        // Test 2: Check localStorage
        const testUser = localStorage.getItem('testUser');
        const telegramData = localStorage.getItem('telegram_init_data');

        // Test 3: Try to create a test user
        let testUserData;
        if (testUser) {
          testUserData = JSON.parse(testUser);
        } else {
          testUserData = {
            id: 6760298907,
            telegramId: '6760298907',
            first_name: 'Admin',
            last_name: 'User',
            username: 'admin_test'
          };
          localStorage.setItem('testUser', JSON.stringify(testUserData));
        }

        // Test 4: Try API login
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';
        const loginResponse = await fetch(`${backendUrl}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: testUserData.id,
            username: testUserData.username,
            first_name: testUserData.first_name,
            last_name: testUserData.last_name
          })
        });

        const loginData = await loginResponse.json();

        setAuthState({
          isLocalDev,
          testUser: testUserData,
          telegramData,
          loginResponse: {
            status: loginResponse.status,
            ok: loginResponse.ok,
            data: loginData
          },
          backendUrl,
          envVars: {
            VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
            NODE_ENV: import.meta.env.NODE_ENV,
            MODE: import.meta.env.MODE
          }
        });
      } catch (error) {
        setAuthState({
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setLoading(false);
      }
    };

    testAuth();
  }, []);

  const createTestUser = () => {
    const testUser = {
      id: 6760298907,
      telegramId: '6760298907',
      first_name: 'Admin',
      last_name: 'User',
      username: 'admin_test'
    };
    localStorage.setItem('testUser', JSON.stringify(testUser));
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Testing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authState.envVars, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Local Development Check</h2>
          <p className={authState.isLocalDev ? 'text-green-400' : 'text-red-400'}>
            {authState.isLocalDev ? '✅ Local development detected' : '❌ Not in local development'}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Test User</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authState.testUser, null, 2)}
          </pre>
          <button
            onClick={createTestUser}
            className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Create/Reset Test User
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">API Login Test</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authState.loginResponse, null, 2)}
          </pre>
        </div>

        {authState.error && (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-red-400">Error</h2>
            <pre className="bg-red-900 p-4 rounded text-sm overflow-auto">
              {authState.error}
            </pre>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <div className="space-y-2">
            <p>1. If test user is created successfully, try accessing the main app</p>
            <p>2. Check browser console for any JavaScript errors</p>
            <p>3. Verify WebSocket connection is working</p>
            <a
              href="/"
              className="inline-block bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Go to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;
