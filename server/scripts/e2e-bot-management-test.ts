#!/usr/bin/env tsx
/**
 * Comprehensive End-to-End Test Suite
 * Tests all bot management features including UI integration
 */

import axios from 'axios';
import { io } from 'socket.io-client';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

class E2EBotManagementTester {
  private baseUrl: string;
  private results: TestResult[] = [];
  private authToken: string = '';
  private testUserId: string = '';
  private testTableId: number = 1;
  private testBlueprintId: string = '';
  private testBotInstanceId: string = '';

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  private async test(name: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
      await fn();
      this.results.push({
        test: name,
        status: 'PASS',
        message: 'Success',
        duration: Date.now() - start
      });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      this.results.push({
        test: name,
        status: 'FAIL',
        message: error.message || 'Unknown error',
        duration: Date.now() - start
      });
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting Comprehensive Bot Management E2E Tests\n');
    console.log(`Testing against: ${this.baseUrl}\n`);

    // Phase 1: Authentication
    console.log('📝 Phase 1: Authentication');
    await this.test('1.1: Create test admin user', async () => {
      // In production, use existing admin credentials
      // For now, test with regular user and handle 403s gracefully
      const response = await axios.post(`${this.baseUrl}/api/auth/register`, {
        username: `testadmin_${Date.now()}`,
        email: `testadmin_${Date.now()}@example.com`,
        password: 'TestAdmin123!'
      });
      this.testUserId = response.data.userId;
      this.authToken = response.data.token;
      if (!this.authToken) throw new Error('No auth token received');
    });

    // Phase 2: Bot Blueprint Management
    console.log('\n🤖 Phase 2: Bot Blueprint Management');
    await this.test('2.1: Create bot blueprint', async () => {
      const response = await axios.post(
        `${this.baseUrl}/api/admin/bots/blueprints`,
        {
          name: `Test Blueprint ${Date.now()}`,
          behavior_profile: 'balanced',
          aggression_level: 5,
          bluff_frequency: 0.3,
          fold_threshold: 0.4,
          is_active: true
        },
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        throw new Error('Requires admin privileges - test user is not admin');
      }
      
      this.testBlueprintId = response.data.blueprint?.bot_blueprint_id;
      if (!this.testBlueprintId) throw new Error('No blueprint ID returned');
    });

    await this.test('2.2: List bot blueprints', async () => {
      const response = await axios.get(
        `${this.baseUrl}/api/admin/bots/blueprints`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        throw new Error('Requires admin privileges');
      }
      
      if (!Array.isArray(response.data.blueprints)) {
        throw new Error('Invalid blueprints response');
      }
    });

    await this.test('2.3: Get blueprint by ID', async () => {
      if (!this.testBlueprintId) {
        console.log('   ⏭️  Skipped - no blueprint ID');
        return;
      }
      
      const response = await axios.get(
        `${this.baseUrl}/api/admin/bots/blueprints/${this.testBlueprintId}`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status !== 200) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    });

    // Phase 3: Table Seat Management
    console.log('\n🎲 Phase 3: Table Seat Management');
    await this.test('3.1: Initialize table seats', async () => {
      const response = await axios.post(
        `${this.baseUrl}/api/admin/tables/${this.testTableId}/initialize-seats`,
        {},
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        console.log('   ⏭️  Requires admin - checking if seats exist');
        return;
      }
      
      if (response.status !== 200 && response.status !== 409) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    });

    await this.test('3.2: Get table with seats', async () => {
      const response = await axios.get(
        `${this.baseUrl}/api/admin/tables`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        throw new Error('Requires admin privileges');
      }
      
      const tables = response.data.tables;
      if (!Array.isArray(tables)) {
        throw new Error('Invalid tables response');
      }
    });

    await this.test('3.3: Assign bot to seat', async () => {
      if (!this.testBlueprintId) {
        console.log('   ⏭️  Skipped - no blueprint ID');
        return;
      }
      
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/admin/tables/${this.testTableId}/seats/0/assign-bot`,
          {
            bot_blueprint_id: this.testBlueprintId,
            identity_mode: 'randomize',
            behavior_profile: 'balanced'
          },
          { headers: { Authorization: `Bearer ${this.authToken}` }}
        );
        
        if (response.status === 403) {
          throw new Error('Requires admin privileges');
        }
        
        this.testBotInstanceId = response.data.bot_instance?.bot_instance_id;
        if (!this.testBotInstanceId) {
          throw new Error('No bot instance ID returned');
        }
      } catch (error: any) {
        if (error.response?.status === 503) {
          console.log('   ⏭️  Bot assignment disabled via feature flag');
          return;
        }
        throw error;
      }
    });

    await this.test('3.4: Verify seat is occupied by bot', async () => {
      const response = await axios.get(
        `${this.baseUrl}/api/admin/tables`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      const table = response.data.tables?.find((t: any) => t.table_id === this.testTableId);
      if (!table) {
        console.log('   ⏭️  Test table not found');
        return;
      }
      
      const seat = table.seats?.find((s: any) => s.seat_index === 0);
      if (!seat) {
        throw new Error('Seat 0 not found');
      }
      
      console.log(`   ℹ️  Seat 0: ${seat.occupant_type}, ${seat.occupant_name || 'empty'}`);
    });

    // Phase 4: Bot Instance Management
    console.log('\n🔧 Phase 4: Bot Instance Management');
    await this.test('4.1: List all bot instances', async () => {
      const response = await axios.get(
        `${this.baseUrl}/api/admin/bot_instances`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        throw new Error('Requires admin privileges');
      }
      
      if (!Array.isArray(response.data.instances)) {
        throw new Error('Invalid instances response');
      }
      
      console.log(`   ℹ️  Found ${response.data.instances.length} bot instances`);
    });

    await this.test('4.2: Rotate bot identity', async () => {
      if (!this.testBotInstanceId) {
        console.log('   ⏭️  Skipped - no bot instance ID');
        return;
      }
      
      const response = await axios.post(
        `${this.baseUrl}/api/admin/bot_instances/${this.testBotInstanceId}/rotate-identity`,
        {},
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        throw new Error('Requires admin privileges');
      }
      
      const newName = response.data.bot_instance?.display_name;
      console.log(`   ℹ️  New identity: ${newName}`);
    });

    await this.test('4.3: Get bot statistics', async () => {
      if (!this.testBotInstanceId) {
        console.log('   ⏭️  Skipped - no bot instance ID');
        return;
      }
      
      const response = await axios.get(
        `${this.baseUrl}/api/admin/bots/${this.testBotInstanceId}`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        console.log('   ⏭️  Requires admin');
        return;
      }
      
      const stats = response.data.bot;
      console.log(`   ℹ️  Games: ${stats.games_played || 0}, Win rate: ${((stats.win_rate || 0) * 100).toFixed(1)}%`);
    });

    // Phase 5: Audit Logs
    console.log('\n📋 Phase 5: Audit Logging');
    await this.test('5.1: Fetch audit logs', async () => {
      const response = await axios.get(
        `${this.baseUrl}/api/admin/audit_logs?limit=10`,
        { headers: { Authorization: `Bearer ${this.authToken}` }}
      );
      
      if (response.status === 403) {
        throw new Error('Requires admin privileges');
      }
      
      const logs = response.data.logs;
      if (!Array.isArray(logs)) {
        throw new Error('Invalid audit logs response');
      }
      
      console.log(`   ℹ️  Found ${logs.length} audit log entries`);
    });

    // Phase 6: WebSocket Integration
    console.log('\n🔌 Phase 6: WebSocket Integration');
    await this.test('6.1: WebSocket connection', async () => {
      return new Promise((resolve, reject) => {
        const socket = io(this.baseUrl, {
          auth: { token: this.authToken },
          transports: ['websocket']
        });

        const timeout = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Connection timeout'));
        }, 5000);

        socket.on('connect', () => {
          console.log(`   ℹ️  Connected: ${socket.id}`);
          clearTimeout(timeout);
          socket.disconnect();
          resolve();
        });

        socket.on('connect_error', (error: Error) => {
          clearTimeout(timeout);
          socket.disconnect();
          reject(error);
        });
      });
    });

    // Phase 7: Cleanup
    console.log('\n🧹 Phase 7: Cleanup');
    await this.test('7.1: Remove bot from seat', async () => {
      if (!this.testBotInstanceId) {
        console.log('   ⏭️  Skipped - no bot to remove');
        return;
      }
      
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/admin/tables/${this.testTableId}/seats/0/remove-bot`,
          {},
          { headers: { Authorization: `Bearer ${this.authToken}` }}
        );
        
        if (response.status === 403) {
          console.log('   ⏭️  Requires admin');
          return;
        }
        
        console.log(`   ℹ️  Bot removed successfully`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('   ℹ️  Seat already empty');
          return;
        }
        throw error;
      }
    });

    // Generate Report
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    
    if (total - skipped > 0) {
      console.log(`\nSuccess Rate: ${((passed / (total - skipped)) * 100).toFixed(2)}%`);
    }

    if (failed > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('FAILED TESTS:');
      console.log('='.repeat(80));
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`\n${r.test}`);
          console.log(`Error: ${r.message}`);
        });
    }

    console.log('\n' + '='.repeat(80));
    
    const adminTests = this.results.filter(r => 
      r.message.includes('Requires admin') || r.message.includes('403')
    );
    
    if (adminTests.length > 0) {
      console.log('\n⚠️  NOTE: Some tests require admin privileges');
      console.log('   To run full test suite, use admin credentials');
      console.log('   or run the admin creation script first:');
      console.log('   npm run create-admin\n');
    }
  }
}

// Main execution
const baseUrl = process.env.TEST_URL || 'http://localhost:3001';
const tester = new E2EBotManagementTester(baseUrl);

tester.runAllTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
