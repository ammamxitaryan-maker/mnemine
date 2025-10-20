// Test calculateAvailableBalance function
function calculateAvailableBalance(wallets) {
  return wallets
    .filter(w => w.currency === 'NON')
    .reduce((sum, w) => sum + w.balance, 0);
}

// Test data
const testWallets = [
  { currency: 'USD', balance: 0 },
  { currency: 'NON', balance: 3.0 },
  { currency: 'MNE', balance: 5.0 }
];

const result = calculateAvailableBalance(testWallets);
console.log('Test wallets:', testWallets);
console.log('Available balance (NON):', result);

// Test with multiple NON wallets
const testWalletsMultiple = [
  { currency: 'USD', balance: 0 },
  { currency: 'NON', balance: 2.0 },
  { currency: 'NON', balance: 1.0 },
  { currency: 'MNE', balance: 5.0 }
];

const resultMultiple = calculateAvailableBalance(testWalletsMultiple);
console.log('\nTest wallets (multiple NON):', testWalletsMultiple);
console.log('Available balance (NON):', resultMultiple);
