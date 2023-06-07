import React from 'react';
import './App.css';
import { ethers, utils } from 'ethers'
import { ChainId } from '@biconomy/core-types';
import SmartAccount from '@biconomy/smart-account';
import { config } from './config'

const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com')



const privateKey = 'ENTER_YOUR_PRIVATE_KEY'

let signer = new ethers.Wallet(privateKey, provider);


const options: any = {
  activeNetworkId: ChainId.POLYGON_MAINNET,
  supportedNetworksIds: [
    ChainId.POLYGON_MAINNET
  ],
  networkConfig: [
    {
      chainId: ChainId.POLYGON_MAINNET,
      dappAPIKey: "AbkgLpPci.8ac593cc-f870-4472-9515-f8f9275d390b",
    },
  ],
};

const sdk = new SmartAccount(signer, options);

function App() {
  const [address, setAddress] = React.useState('')
  const wallet = React.useRef<SmartAccount>()
  const [loading, setLoading] = React.useState<Boolean>(false)

  React.useEffect(() => {
    createWallet()
  }, [])

  React.useEffect(() => {
    if (wallet.current) {
      wallet.current?.on('txHashGenerated', response => {
        console.log('txHashGenerated event received via emitter', response);
      })
      wallet.current?.on('txMined', response => {
        console.log('txMined event received via emitter', response);
        alert("Transaction is confirmed on " + response.transactionHash)
      })
      wallet.current?.on('error', response => {
        console.log('error event received via emitter', response);
      })
    }
    return () => {
      wallet.current?.removeAllListeners()
    }
  }, [wallet])

  const createWallet = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log("🚀 ~ file: App.tsx:41 ~ createWal ~ error:", error)
    }
  }


  const senNative = async () => {
    if (!wallet.current) {
      return
    }
    const tx = {
      to: "0x908F050989875E3fEeb077b24a982AE7fB711995",
      data: "0x",
      value: ethers.utils.parseEther(Number(0.0001).toString()),
    }
    // Sending transaction
    console.log("🚀 ~ file: App.tsx:95 ~ sendMatic ~ tx:", tx)
    const txResponse = await wallet.current.sendTransaction({ transaction: tx });
    console.log('Tx Response', txResponse);
    const txReciept = await txResponse.wait();
    console.log('Tx hash', txReciept.transactionHash);
  }

  const sendUSDC = async () => {
    if (!wallet.current) {
      return
    }
    const usdcContract = new ethers.Contract(config.usdc.address, config.usdc.abi, provider)
    const transfer = await usdcContract.populateTransaction.transfer("0xcdba4bc7b318317b29329a128698bab94145cca7", ethers.BigNumber.from("1000000")); // 1 USDC
    const tx = {
      to: config.usdc.address,
      data: transfer.data
    }

    const feeQuotes = await wallet.current.getFeeQuotes({
      transaction: tx,
    });

    const quote = feeQuotes[0] // use native for payment fee

    const transaction =
      await wallet.current.createUserPaidTransaction({
        transaction: tx,
        feeQuote: quote,
      });

    await wallet.current.sendUserPaidTransaction({
      tx: transaction,
    });
  }

  const wrapMatic = async () => {
    const tx = {
      data: "0xd0e30db0",
      to: "0x9c3c9283d3e44854697cd22d3faa240cfb032889",
      value: "0x38d7ea4c68000"
    }
    const wrap = await wallet.current?.sendTransaction({ transaction: tx })
    console.log("🚀 ~ file: App.tsx:127 ~ wrapMatic ~ wrap:", wrap)
    const txResponse = await wrap?.wait();
    console.log("🚀 ~ file: App.tsx:151 ~ wrapMatic ~ txResponse:", txResponse)
    alert('Wrap success with hash' + txResponse?.transactionHash)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h3>OEA address:</h3>
        <span>{signer.address}</span>
        <h3>Smart Address:</h3>
        <span>{address}</span>
        {loading && <span>Wait creating smart wallet...</span>}
        <button onClick={createWallet} >
          <p>Create Wallet</p>
        </button>
        <button onClick={senNative} disabled={!wallet.current?.address}>
          <p>Send NATIVE</p>
        </button>
        <button onClick={sendUSDC} disabled={!wallet.current?.address}>
          <p>Send USDC</p>
        </button>
        {/* <button disabled={!wallet.current?.address} onClick={wrapMatic}>
          <p>Test sign transaction wrap MATIC</p>
        </button> */}
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
