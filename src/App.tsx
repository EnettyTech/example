import React from 'react';
import './App.css';
import { ethers, utils } from 'ethers'
import { ChainId } from '@biconomy/core-types';
import SmartAccount from 'react-native-biconomy-sca';
import { config } from './config'

const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/polygon_mumbai')
const privateKey = 'EOA_PRIVATE_KEY'

let signer = new ethers.Wallet(privateKey, provider);

const options: any = {
  activeNetworkId: ChainId.POLYGON_MUMBAI,
  supportedNetworksIds: [
    ChainId.BSC_TESTNET,
    ChainId.POLYGON_MAINNET,
    ChainId.POLYGON_MUMBAI,
  ],
  networkConfig: [
    {
      chainId: ChainId.POLYGON_MUMBAI,
      dappAPIKey: "WEX9LXdFW.13107308-4631-4ba5-9e23-2a8bf8270948",
    },
  ],
};

const sdk = new SmartAccount(signer, options);

function App() {
  const [address, setAddress] = React.useState('')
  const wallet = React.useRef<SmartAccount>()

  const createWallet = async () => {
    try {
      wallet.current = await sdk.init();

      console.log("🚀 ~ file: App.tsx:36 ~ createWal ~ wallet:", wallet)
      setAddress(wallet.current.address)
      const balanceParams = {
        chainId: ChainId.POLYGON_MUMBAI, // chainId of your choice
        eoaAddress: wallet.current.address,
        tokenAddresses: [],
      };
      const balance = await wallet.current.getAlltokenBalances(balanceParams);
      console.log("🚀 ~ file: App.tsx:42 ~ createWal ~ balance:", balance)
      // Transaction subscription
      wallet.current.on('txHashGenerated', (response: any) => {
        console.log('txHashGenerated event received via emitter', response);
      });
      wallet.current.on('txMined', (response: any) => {
        console.log('txMined event received via emitter', response);
      });
      wallet.current.on('error', (response: any) => {
        console.log('error event received via emitter', response);
      });
    } catch (error) {
      console.log("🚀 ~ file: App.tsx:41 ~ createWal ~ error:", error)
    }
  }


  const sendMatic = async () => {
    if (!wallet.current) {
      return
    }
    const maticContract = new ethers.Contract(config.MATIC.address, config.MATIC.abi, provider)
    const transfer = await maticContract.populateTransaction.transfer("0x908F050989875E3fEeb077b24a982AE7fB711995", ethers.BigNumber.from("1000000000000"))
    console.log("🚀 ~ file: App.tsx:79 ~ send ~ transfer:", transfer)
    const tx2 = {
      to: config.MATIC.address,
      data: transfer.data
    }
    const transaction = await wallet.current.sendTransaction({ transaction: tx2 })
    console.log("🚀 ~ file: App.tsx:85 ~ send ~ transaction:", transaction)
    const txReciept = await transaction.wait(1);
    console.log('Tx hash', txReciept.transactionHash);
  }

  const sendUSDC = async () => {
    if (!wallet.current) {
      return
    }
    const txs = []
    const usdcContract = new ethers.Contract(config.usdc.address, config.usdc.abi, provider)
    const approve = await usdcContract.populateTransaction.approve(wallet.current?.address, ethers.BigNumber.from("1000000"));
    const tx1 = {
      to: config.usdc.address,
      data: approve.data
    }
    txs.push(tx1);
    const transfer = await usdcContract.populateTransaction.transfer("0x908F050989875E3fEeb077b24a982AE7fB711995", ethers.BigNumber.from("1000000"));
    const tx2 = {
      to: config.usdc.address,
      data: transfer.data
    }
    txs.push(tx2)

    const txResponse = await wallet.current.sendTransactionBatch({ transactions: txs });
    console.log('userOp hash', txResponse.hash);
    const txReciept = await txResponse.wait(1);
    console.log('Tx hash', txReciept.transactionHash);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h3>Address:{address}</h3>
        <button onClick={createWallet} >
          <p>Create Wallet</p>
        </button>
        <button onClick={sendMatic} >
          <p>Send MATIC</p>
        </button>
        <button onClick={sendUSDC} >
          <p>Send USDC</p>
        </button>
      </header>
    </div>
  );
}

export const numberToWei = (number: any, decimal: number = 18) => {
  if (!number) {
    return '0';
  }
  number = number.toString();

  const arr = number.split('.');
  if (arr[1] && arr[1].length > decimal) {
    arr[1] = arr[1].slice(0, decimal);
    number = arr.join('.');
  }

  return utils.parseUnits(number, decimal).toString();
};

export default App;
