import React, { useState, useEffect } from 'react';
import { useDynamicMNEEarnings } from '@/hooks/useDynamicMNEEarnings';
import { MiningSlot } from '@/hooks/useSlotsData';
import { testRunner } from '@/utils/testRunner';

interface DynamicEarningsTestProps {
  slotsData?: MiningSlot[];
}

export const DynamicEarningsTest: React.FC<DynamicEarningsTestProps> = ({ slotsData }) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const dynamicEarnings = useDynamicMNEEarnings(slotsData);

  // Test dynamic earnings calculation
  const runEarningsTest = () => {
    setIsRunning(true);
    const results: any[] = [];
    
    // Test 1: Check if slots data is provided
    results.push({
      test: 'Slots Data Available',
      status: slotsData && slotsData.length > 0 ? 'PASS' : 'FAIL',
      details: `Slots count: ${slotsData?.length || 0}`
    });

    // Test 2: Check active slots
    const activeSlots = slotsData?.filter(slot => 
      slot.isActive && new Date(slot.expiresAt) > new Date()
    ) || [];
    results.push({
      test: 'Active Slots Found',
      status: activeSlots.length > 0 ? 'PASS' : 'FAIL',
      details: `Active slots: ${activeSlots.length}`
    });

    // Test 3: Check dynamic earnings calculation
    results.push({
      test: 'Dynamic Earnings Calculation',
      status: dynamicEarnings.totalEarnings >= 0 ? 'PASS' : 'FAIL',
      details: `Total earnings: ${dynamicEarnings.totalEarnings.toFixed(6)} MNE`
    });

    // Test 4: Check earnings per second
    results.push({
      test: 'Earnings Per Second',
      status: dynamicEarnings.perSecondEarnings >= 0 ? 'PASS' : 'FAIL',
      details: `Per second: ${dynamicEarnings.perSecondEarnings.toFixed(8)} MNE/sec`
    });

    // Test 5: Check if earnings are updating
    const initialEarnings = dynamicEarnings.totalEarnings;
    setTimeout(() => {
      const updatedEarnings = dynamicEarnings.totalEarnings;
      results.push({
        test: 'Earnings Update',
        status: updatedEarnings > initialEarnings ? 'PASS' : 'FAIL',
        details: `Initial: ${initialEarnings.toFixed(6)}, Updated: ${updatedEarnings.toFixed(6)}`
      });
      setTestResults([...results]);
      setIsRunning(false);
    }, 2000);

    setTestResults(results);
  };

  // Performance test for main page
  const runPerformanceTest = async () => {
    const results = await testRunner.testPerformance();
    setTestResults(prev => [...prev, ...results.map(r => ({
      test: r.name,
      status: r.passed ? 'PASS' : 'FAIL',
      details: `${r.value.toFixed(2)}${r.unit} (threshold: ${r.threshold}${r.unit})`
    }))]);
  };

  const runComprehensiveTest = async () => {
    const results = await testRunner.runAllTests(slotsData || []);
    setTestResults(prev => [...prev, {
      test: 'Comprehensive Test Suite',
      status: results.summary.failedTests === 0 ? 'PASS' : 'FAIL',
      details: `Passed: ${results.summary.passedTests}/${results.summary.totalTests} (${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%)`
    }]);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-4">Dynamic Earnings & Performance Test</h3>
      
      <div className="mb-4">
        <button 
          onClick={runEarningsTest}
          disabled={isRunning}
          className="mr-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Dynamic Earnings
        </button>
        <button 
          onClick={runPerformanceTest}
          className="mr-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Test Performance
        </button>
        <button 
          onClick={runComprehensiveTest}
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
        >
          Run All Tests
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Current Dynamic Earnings:</h4>
        <div className="bg-gray-800 p-3 rounded">
          <p>Total: {dynamicEarnings.totalEarnings.toFixed(6)} MNE</p>
          <p>Per Second: {dynamicEarnings.perSecondEarnings.toFixed(8)} MNE/sec</p>
          <p>Hourly: {dynamicEarnings.hourlyEarnings.toFixed(6)} MNE/hour</p>
          <p>Daily: {dynamicEarnings.dailyEarnings.toFixed(6)} MNE/day</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Test Results:</h4>
        {testResults.map((result, index) => (
          <div key={index} className="mb-2 p-2 bg-gray-800 rounded">
            <div className="flex items-center justify-between">
              <span className="font-medium">{result.test}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'PASS' ? 'bg-green-600' : 
                result.status === 'FAIL' ? 'bg-red-600' : 'bg-yellow-600'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{result.details}</p>
            {result.subResults && (
              <div className="mt-2 ml-4">
                {result.subResults.map((sub: any, subIndex: number) => (
                  <div key={subIndex} className="text-sm">
                    {sub.operation}: {sub.duration} ({sub.status})
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
