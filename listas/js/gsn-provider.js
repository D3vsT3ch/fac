// GSN Provider configuration and initialization
const GSNProvider = {
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

            const gsnProvider = await window.ethereum.request({ 
                method: 'eth_requestAccounts'
            }).then(() => {
                return new Web3.providers.HttpProvider('http://localhost:8545');
            });

            return gsnProvider;
        } catch (error) {
            console.error('GSN Provider initialization error:', error);
            throw error;
        }
    }
};