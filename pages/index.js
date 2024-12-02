import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [currentOwner, setCurrentOwner] = useState(""); // New state variable for current owner's address

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  };

  const deposit = async () => {
    if (atm) {
      // Ask the user for an amount to deposit
      let amount = parseFloat(prompt("Enter the amount you wish to deposit:"));

      // Check if the input is a valid number
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive number.");
        return;
      }

      let tx = await atm.deposit(amount);
      await tx.wait();
      getBalance();
    }
  };

  const withdraw = async () => {
    if (atm) {
      // Ask the user for an amount to withdraw
      let amount = parseFloat(prompt("Enter the amount you wish to withdraw:"));

      // Check if the input is a valid number
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive number.");
        return;
      } else if (amount > balance) {
        alert("You cannot withdraw an amount larger than your current balance.");
        return;
      }

      let tx = await atm.withdraw(amount);
      await tx.wait();
      getBalance();
    }
  };

  const withdrawall = async () => {
    if (atm) {
      getBalance();
      let tx = await atm.withdraw(balance);
      await tx.wait();
      getBalance();
    }
  };

  const transferOwnership = async () => {
    if (atm) {
      let newOwnerAddress = prompt("Enter the new owner's address:");
      if (!ethers.utils.isAddress(newOwnerAddress)) {
        alert("Please enter a valid Ethereum address.");
        return;
      }

      let tx = await atm.transferOwnership(newOwnerAddress);
      await tx.wait();
      alert("Ownership transferred successfully!");
    }
  };

  const displayCurrentOwner = async () => {
    if (atm) {
      let ownerAddress = await atm.owner();
      setCurrentOwner(ownerAddress);
      alert(`Current Owner: ${ownerAddress}`);
    }
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Please connect your Metamask wallet</button>;
    }

    if (balance == undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>
        <button onClick={deposit}>Deposit ETH</button>
        <button onClick={withdraw}>Withdraw ETH</button>
        <button onClick={withdrawall}>Withdraw all ETH</button>
        <button onClick={transferOwnership}>Transfer Ownership</button>
        <button onClick={displayCurrentOwner}>Current Owner</button>
      </div>
    );
  };

  useEffect(() => {
    getWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        handleAccount(accounts);
      });
    }
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Metacrafters ATM!</h1>
      </header>
      <header>
        <h2>v0.2</h2>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh; /* This makes the container take up the full viewport height */
          text-align: center;
          background-color: #0e1117;
          color: #ffffff;
        }
      `}
      </style>
    </main>
  );
}
