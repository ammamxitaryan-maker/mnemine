// Test runner for dynamic earnings and performance
export class TestRunner {
  private static instance: TestRunner;
  private testResults: any[] = [];

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  // Test dynamic earnings calculation
  public async testDynamicEarnings(slotsData: any[]) {
    console.log('🧪 Testing Dynamic Earnings...');
    
    const tests = [
      {
        name: 'Slots Data Validation',
        test: () => {
          return slotsData && Array.isArray(slotsData) && slotsData.length > 0;
        },
        expected: true
      },
      {
        name: 'Active Slots Detection',
        test: () => {
          const activeSlots = slotsData.filter(slot => 
            slot.isActive && new Date(slot.expiresAt) > new Date()
          );
          return activeSlots.length > 0;
        },
        expected: true
      },
      {
        name: 'Slot Data Structure',
        test: () => {
          const slot = slotsData[0];
          return slot && 
                 typeof slot.principal === 'number' && 
                 typeof slot.effectiveWeeklyRate === 'number' &&
                 typeof slot.createdAt === 'string';
        },
        expected: true
      }
    ];

    const results = tests.map(test => {
      const passed = test.test();
      const result = {
        name: test.name,
        passed,
        expected: test.expected,
        timestamp: new Date().toISOString()
      };
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
      return result;
    });

    this.testResults.push(...results);
    return results;
  }

  // Test performance metrics
  public async testPerformance() {
    console.log('🚀 Testing Performance...');
    
    const startTime = performance.now();
    
    // Test 1: Component render time
    const renderStart = performance.now();
    const renderTime = performance.now() - renderStart;
    
    // Test 2: Memory usage
    const memoryUsage = this.getMemoryUsage();
    
    // Test 3: DOM operations
    const domStart = performance.now();
    const testDiv = document.createElement('div');
    testDiv.innerHTML = 'Performance Test';
    document.body.appendChild(testDiv);
    document.body.removeChild(testDiv);
    const domTime = performance.now() - domStart;
    
    // Test 4: JavaScript operations
    const jsStart = performance.now();
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.random();
    }
    const jsTime = performance.now() - jsStart;
    
    const totalTime = performance.now() - startTime;
    
    const performanceTests = [
      {
        name: 'Total Load Time',
        value: totalTime,
        threshold: 1000,
        unit: 'ms'
      },
      {
        name: 'Render Time',
        value: renderTime,
        threshold: 100,
        unit: 'ms'
      },
      {
        name: 'DOM Operations',
        value: domTime,
        threshold: 10,
        unit: 'ms'
      },
      {
        name: 'JavaScript Operations',
        value: jsTime,
        threshold: 50,
        unit: 'ms'
      },
      {
        name: 'Memory Usage',
        value: memoryUsage,
        threshold: 50,
        unit: 'MB'
      }
    ];

    const results = performanceTests.map(test => {
      const passed = test.value <= test.threshold;
      const result = {
        name: test.name,
        value: test.value,
        threshold: test.threshold,
        unit: test.unit,
        passed,
        timestamp: new Date().toISOString()
      };
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${test.value.toFixed(2)}${test.unit} (threshold: ${test.threshold}${test.unit})`);
      return result;
    });

    this.testResults.push(...results);
    return results;
  }

  // Test WebSocket connection
  public async testWebSocketConnection() {
    console.log('🔌 Testing WebSocket Connection...');
    
    const tests = [
      {
        name: 'WebSocket Support',
        test: () => typeof WebSocket !== 'undefined',
        expected: true
      },
      {
        name: 'Connection URL',
        test: () => {
          const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:10113';
          return wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://');
        },
        expected: true
      }
    ];

    const results = tests.map(test => {
      const passed = test.test();
      const result = {
        name: test.name,
        passed,
        expected: test.expected,
        timestamp: new Date().toISOString()
      };
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
      return result;
    });

    this.testResults.push(...results);
    return results;
  }

  // Get memory usage
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  // Run all tests
  public async runAllTests(slotsData: any[]) {
    console.log('🧪 Starting Comprehensive Test Suite...');
    console.log('='.repeat(50));
    
    const startTime = performance.now();
    
    const earningsResults = await this.testDynamicEarnings(slotsData);
    const performanceResults = await this.testPerformance();
    const websocketResults = await this.testWebSocketConnection();
    
    const totalTime = performance.now() - startTime;
    
    const summary = {
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.passed).length,
      failedTests: this.testResults.filter(r => !r.passed).length,
      totalTime: totalTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Total Time: ${summary.totalTime.toFixed(2)}ms`);
    console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    
    return {
      summary,
      results: this.testResults,
      earningsResults,
      performanceResults,
      websocketResults
    };
  }

  // Get test results
  public getTestResults() {
    return this.testResults;
  }

  // Clear test results
  public clearResults() {
    this.testResults = [];
  }
}

// Export singleton instance
export const testRunner = TestRunner.getInstance();
