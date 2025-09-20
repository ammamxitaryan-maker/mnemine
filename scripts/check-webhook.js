#!/usr/bin/env node

const https = require('https');

const BOT_TOKEN = '8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE';
const WEBHOOK_URL = 'https://mnemine-app.onrender.com/api/webhook/8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE';

async function checkWebhookInfo() {
  try {
    console.log('🔍 Checking Telegram Bot Webhook Status...\n');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      const webhookInfo = data.result;
      console.log('📊 Webhook Information:');
      console.log(`   URL: ${webhookInfo.url || 'Not set'}`);
      console.log(`   Has custom certificate: ${webhookInfo.has_custom_certificate}`);
      console.log(`   Pending update count: ${webhookInfo.pending_update_count}`);
      console.log(`   Last error date: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toISOString() : 'None'}`);
      console.log(`   Last error message: ${webhookInfo.last_error_message || 'None'}`);
      console.log(`   Max connections: ${webhookInfo.max_connections}`);
      console.log(`   Allowed updates: ${webhookInfo.allowed_updates ? webhookInfo.allowed_updates.join(', ') : 'All'}`);
      
      if (webhookInfo.url !== WEBHOOK_URL) {
        console.log('\n⚠️  Webhook URL mismatch!');
        console.log(`   Expected: ${WEBHOOK_URL}`);
        console.log(`   Current:  ${webhookInfo.url || 'Not set'}`);
      } else {
        console.log('\n✅ Webhook URL is correctly set!');
      }
      
      if (webhookInfo.last_error_message) {
        console.log('\n❌ Last webhook error:');
        console.log(`   Date: ${new Date(webhookInfo.last_error_date * 1000).toISOString()}`);
        console.log(`   Message: ${webhookInfo.last_error_message}`);
      }
      
    } else {
      console.error('❌ Failed to get webhook info:', data.description);
    }
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

async function setWebhook() {
  try {
    console.log('\n🔧 Setting webhook...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        max_connections: 40,
        allowed_updates: ['message', 'callback_query']
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`   URL: ${WEBHOOK_URL}`);
    } else {
      console.error('❌ Failed to set webhook:', data.description);
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

async function testBot() {
  try {
    console.log('\n🤖 Testing bot...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      const botInfo = data.result;
      console.log('✅ Bot is working!');
      console.log(`   Name: ${botInfo.first_name}`);
      console.log(`   Username: @${botInfo.username}`);
      console.log(`   ID: ${botInfo.id}`);
      console.log(`   Can join groups: ${botInfo.can_join_groups}`);
      console.log(`   Can read all group messages: ${botInfo.can_read_all_group_messages}`);
      console.log(`   Supports inline queries: ${botInfo.supports_inline_queries}`);
    } else {
      console.error('❌ Bot is not working:', data.description);
    }
  } catch (error) {
    console.error('❌ Error testing bot:', error.message);
  }
}

async function main() {
  console.log('🚀 Telegram Bot Webhook Checker\n');
  
  await testBot();
  await checkWebhookInfo();
  
  const args = process.argv.slice(2);
  if (args.includes('--set-webhook')) {
    await setWebhook();
    await checkWebhookInfo();
  }
  
  console.log('\n💡 To set the webhook, run: node scripts/check-webhook.js --set-webhook');
}

main().catch(console.error);
