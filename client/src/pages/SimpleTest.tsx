"use client";

import { useEffect, useState } from 'react';

const SimpleTest = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:10112/api/stats/simple');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({ error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const testWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:10112/ws?type=userstats&token=anonymous');

      ws.onopen = () => {
        console.log('WebSocket connected!');
        alert('WebSocket connected successfully!');
        ws.close();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert('WebSocket connection failed!');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };
    } catch (error) {
      console.error('WebSocket test failed:', error);
      alert('WebSocket test failed: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Simple Application Test</h1>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Stats Display */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          {stats?.error ? (
            <div className="text-red-400">
              <p>Error fetching stats: {stats.error}</p>
            </div>
          ) : stats?.data ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.data.totalUsers?.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.data.onlineUsers?.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Online Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.data.newUsersToday?.toLocaleString()}</div>
                <div className="text-sm text-gray-400">New Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.data.activeUsers?.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No data available</div>
          )}
        </div>

        {/* WebSocket Test */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">WebSocket Connection Test</h2>
          <button
            onClick={testWebSocket}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
          >
            Test WebSocket Connection
          </button>
        </div>

        {/* API Test */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Health Check</h2>
          <div className="space-y-2">
            <p>Backend URL: http://localhost:10112</p>
            <p>Status: {stats ? '✅ Connected' : '❌ Failed'}</p>
            <p>Last Update: {stats?.data?.lastUpdate ? new Date(stats.data.lastUpdate).toLocaleString() : 'N/A'}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="space-x-4">
            <a
              href="/"
              className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium"
            >
              Go to Main App
            </a>
            <a
              href="/debug"
              className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium"
            >
              Debug Page
            </a>
            <a
              href="/test-auth"
              className="inline-block bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-medium"
            >
              Auth Test
            </a>
          </div>
        </div>

        {/* Raw Data */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Raw API Response</h2>
          <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-64">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;
