import React, { useState, useEffect } from 'react'
import { 
    // getTotalSupply, 
    // balanceOf, 
    // transfer 
} from '../../utils/smart-contract/blockchain.js';

const TokenAdmin = () => {
    // register 
    // account details
    // generate memo
    // erc20Balance
    // get tx hx
    // verify kyc 
    // get asset price
    // cal asset value
    // calc account worth 
    // get transfer fee
    // get withdrawal fee 
    // recover account

    // deposit eth
    // deposit erc20
    // deposit nativeToken

    // transfer eth
    // transfer erc20
    // transfer nativeToken

    // withdraw eth
    // withdraw erc20 
    // withdraw nativeToken

    



    const [totalSupply, setTotalSupply] = useState(0);
    const [balance, setBalance] = useState(0);

    const [account, setAccount] = useState('');
    const [amount, setAmount] = useState(0);
    const [recipient, setRecipient] = useState('');

    const fetchTotalSupply = async () => {
        // try {
        //     const response = await getTotalSupply();
        //     console.log("RESPONSE:", response);
        //     setTotalSupply(response);
        // } catch (error) {
        //     console.error(error);   
            
        // }
    }

    const fetchBalance = async (account) => {
        // // e.preventDefault();
        // try {
        //     const response = await balanceOf(account);

        //     setBalance(response);
        // } catch (error) {
            
        // }
    }

    const transferTokens = async (recipient, amount) => { 
        // try {
        //     const response = await transfer(recipient, amount);
        //     console.log(response);
        // } catch (error) {
        //     console.error(error);
        // }
    }
    
  return (
    <div>
        <h1>TokenAdmin</h1>
        <div>
            <h3>Get total supply</h3>
            <button onClick={fetchTotalSupply}>Get Total Supply</button>
            <div>
                <div>
                    <p>Total supply: {totalSupply.toString()}</p>
                </div>
            </div>
        </div>
        <hr />

        <div>
            <h3>Balance</h3>
            <form onSubmit={(e) => fetchBalance(account)}>
                <input type="text" placeholder="Account" name='account' onChange={(e) => setAccount(e.target.value)}/>
                <button>Get Balance</button>
                <div>
                    <p>Balance: {balance.toString()}</p>
                </div>
            </form>
        </div>
        <hr />

        <div>
            <h3>Transfer</h3>
            <form onSubmit={(e) => transferTokens(recipient, amount)}>
                <input type="text" placeholder="Recipient" name='recipient' onChange={(e) => setRecipient(e.target.value)} />
                <input type="text" placeholder="Amount" name='amount' onChange={(e) => setAmount(e.target.value)}/>
                <button>Transfer</button>
            </form>
        </div>

    </div>
  )
}

export default TokenAdmin;