# NOWPayments Integration Guide

## Overview

This document describes the integration of NOWPayments cryptocurrency payment gateway for USDT deposits in the FastMine application.

## Features

- **USDT Payments**: Accept USDT (TRC20) payments through NOWPayments
- **Real-time Processing**: Automatic webhook processing for payment status updates
- **Secure Verification**: HMAC signature verification for webhook authenticity
- **Multi-currency Support**: USD pricing with USDT payment processing
- **Exchange Rate Integration**: Automatic conversion from USD to NON tokens

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# NOWPayments Configuration
NOWPAYMENTS_API_KEY=your_nowpayments_api_key_here
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret_here
NOWPAYMENTS_SANDBOX_MODE=true
```

### API Keys Setup

1. **Create NOWPayments Account**: Sign up at [nowpayments.io](https://nowpayments.io)
2. **Get API Key**: Navigate to API settings and generate your API key
3. **Get IPN Secret**: Generate IPN secret for webhook verification
4. **Configure Webhook URL**: Set webhook URL to `https://yourdomain.com/api/payments/usdt/webhook`

## API Endpoints

### Create Payment

**POST** `/api/payments/usdt/create`

Creates a new USDT payment invoice through NOWPayments.

**Request Body:**
```json
{
  "telegramId": "123456789",
  "mneAmount": 100.0,
  "description": "NON Purchase"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "invoice_id",
  "orderId": "usdt_1234567890_123",
  "usdtAddress": "T...",
  "usdtAmount": 100.0,
  "mneAmount": 100.0,
  "exchangeRate": 1.0,
  "qrCode": "usdt:T...?amount=100&memo=...",
  "paymentUrl": "https://nowpayments.io/payment/...",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### Payment Status

**GET** `/api/payments/usdt/status/:paymentId`

Get the current status of a payment.

**Response:**
```json
{
  "paymentId": "invoice_id",
  "orderId": "usdt_1234567890_123",
  "status": "COMPLETED",
  "amount": 100.0,
  "currency": "USDT",
  "createdAt": "2024-01-01T10:00:00Z",
  "metadata": {...},
  "serviceStatus": {
    "status": "finished",
    "amount": 100.0,
    "transactionHash": "0x..."
  }
}
```

### Payment History

**GET** `/api/payments/usdt/history/:telegramId`

Get payment history for a user.

**Response:**
```json
[
  {
    "id": "payment_id",
    "orderId": "usdt_1234567890_123",
    "amount": 100.0,
    "currency": "USDT",
    "status": "COMPLETED",
    "createdAt": "2024-01-01T10:00:00Z",
    "metadata": {...}
  }
]
```

## Webhook Processing

### Webhook Endpoint

**POST** `/api/payments/usdt/webhook`

Processes payment status updates from NOWPayments.

**Headers:**
- `x-nowpayments-sig`: HMAC signature for verification

**Webhook Data Format:**
```json
{
  "payment_id": "invoice_id",
  "order_id": "usdt_1234567890_123",
  "payment_status": "finished",
  "pay_address": "T...",
  "price_amount": 100.0,
  "price_currency": "usd",
  "pay_amount": 100.0,
  "pay_currency": "usdttrc20",
  "order_description": "NON Purchase",
  "purchase_id": "purchase_id",
  "outcome_amount": 100.0,
  "outcome_currency": "usd",
  "payin_extra_id": "transaction_hash",
  "smart_contract": "contract_address",
  "network": "tron",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:05:00Z"
}
```

### Payment Statuses

- `waiting`: Payment is waiting for user action
- `confirming`: Payment is being confirmed on blockchain
- `confirmed`: Payment confirmed, processing
- `sending`: Payment is being sent
- `partially_paid`: Partial payment received
- `finished`: Payment completed successfully
- `failed`: Payment failed
- `refunded`: Payment was refunded
- `expired`: Payment expired

## Implementation Details

### Service Architecture

The integration consists of:

1. **USDTPaymentService**: Main service class handling NOWPayments API calls
2. **usdtPaymentController**: Express controller for HTTP endpoints
3. **Webhook Processing**: Automatic payment status updates
4. **Database Integration**: Payment records and user balance updates

### Security Features

- **HMAC Verification**: All webhooks are verified using HMAC-SHA256
- **API Key Authentication**: NOWPayments API calls use API key authentication
- **Input Validation**: All inputs are sanitized and validated
- **Transaction Safety**: Database operations use transactions for consistency

### Error Handling

- **API Errors**: Proper error handling for NOWPayments API failures
- **Webhook Failures**: Graceful handling of webhook processing errors
- **Database Errors**: Transaction rollback on database errors
- **Logging**: Comprehensive logging for debugging and monitoring

## Testing

### Sandbox Mode

Set `NOWPAYMENTS_SANDBOX_MODE=true` for testing with sandbox environment.

### Test Payment Flow

1. Create a payment using the API
2. Use the provided USDT address to send test USDT
3. Monitor webhook processing in logs
4. Verify user balance updates

### Webhook Testing

Use tools like ngrok to expose local webhook endpoint for testing:

```bash
ngrok http 10112
```

Then update webhook URL in NOWPayments dashboard.

## Production Deployment

### Prerequisites

1. **NOWPayments Account**: Production account with verified API keys
2. **SSL Certificate**: HTTPS required for webhook endpoints
3. **Environment Variables**: Production API keys and secrets
4. **Database**: PostgreSQL database for payment records

### Deployment Steps

1. **Update Environment**: Set production NOWPayments credentials
2. **Disable Sandbox**: Set `NOWPAYMENTS_SANDBOX_MODE=false`
3. **Configure Webhook**: Update webhook URL to production domain
4. **Test Integration**: Verify payment flow in production
5. **Monitor Logs**: Set up monitoring for payment processing

### Security Checklist

- [ ] API keys are properly secured
- [ ] Webhook signature verification is enabled
- [ ] HTTPS is configured for webhook endpoint
- [ ] Database connections are encrypted
- [ ] Error logging doesn't expose sensitive data

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check webhook URL configuration
   - Verify HTTPS certificate
   - Check firewall settings

2. **Signature Verification Failed**
   - Verify IPN secret configuration
   - Check webhook payload format
   - Ensure proper HMAC implementation

3. **Payment Not Processing**
   - Check API key validity
   - Verify payment status in NOWPayments dashboard
   - Review error logs

4. **Database Errors**
   - Check database connection
   - Verify table schemas
   - Review transaction logs

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting payment issues.

## Support

For NOWPayments-specific issues:
- [NOWPayments Documentation](https://documenter.getpostman.com/view/7907941/S1a32n38)
- [NOWPayments Support](https://nowpayments.io/contact)

For application-specific issues:
- Check application logs
- Review database records
- Contact development team
