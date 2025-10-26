// API Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:8000'
  },
  production: {
    apiUrl: 'https://chainguardian-api.onrender.com'
  }
};

// Auto-detect environment
const environment = process.env.NODE_ENV || 'development';

export const API_URL = config[environment].apiUrl;

// Optional: Add more config
export const CONTRACT_ADDRESS = '0xYourContractAddress';
export const CHAIN_ID = 80001; // Mumbai testnet

export default config;