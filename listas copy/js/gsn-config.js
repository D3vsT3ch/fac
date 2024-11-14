// GSN Provider configuration and initialization
window.GSNConfig = {
    config: {
        paymasterAddress: paymaster,
        forwarderAddress: trustedForwarder,
        relayHubAddress: relayHub,
        chainId: 31337,
        methodSuffix: '_v4',
        jsonStringifyRequest: true,
        loggerConfiguration: {
            logLevel: 'debug'
        }
    },

    async init() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const gsnConfig = {
                ...this.config,
                provider: window.ethereum
            };

            await window.ethereum.request({ 
                method: 'eth_requestAccounts'
            });

            return new Web3.providers.HttpProvider('http://localhost:8545');
        } catch (error) {
            console.error('GSN Provider initialization error:', error);
            throw error;
        }
    }
};