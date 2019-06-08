'use strict';
const siapi = require('./speariron.js');

const connectRPC = (url) => {
        ws = new RPC(url);
        
        const __ready = (resolve, reject) =>
        {
            ws.on('open',  function(event) { resolve(true) });
            ws.on('error', function(error) { console.trace(error); reject(false) });
        }

        return new Promise(__ready);
}

connectRPC('ws://localhost:3000')
.then((rc) => {
    if (!rc) throw("failed connection");

    ws.subscribe('ethstats');
    ws.on('ethstats', (stats) => {
        if (stats.blockHeight === 0) return;
        document.getElementById('ethStats').innerHTML = 
        `<h2>Ethereum Network Status</h2>
        <p>Block Height: ${stats.blockHeight}</p>
        <p>Block Timestamp: ${stats.blockTime}</p>
        <p>Highest Block: ${stats.highestBlock}</p>
        `;

        if (account) {
            getEthBalance(account);
        }
    })

    getEthBalance = (addr) => {
        document.getElementById('balance').innerHTML = "";
        ws.call('addrEtherBalance', [addr])
              .then((ethb) => {
                ethb = Number(utils.fromWei(ethb, 'ether')).toFixed(4);
                document.getElementById('balance').innerHTML = `Balance: ${ethb} Ether`;
              })
    }

    allAccounts = () => {
        ws.call('accounts')
          .then((list) => {
              document.getElementById('accTitle').innerHTML = `Account Info` 
              let dropdown = document.getElementById('accountList');
              let defaultOption = document.createElement('option');
              defaultOption.value = 'Please pick an account ...';
              defaultOption.innerHTML = 'Please pick an account ...';
              defaultOption.selected = 'selected';
              dropdown.appendChild(defaultOption);

              dropdown.onchange = () => {
                account = dropdown.value;  
                console.log(`Account is now ${account}`);
                document.getElementById('accounts').value = account; 
                getEthBalance(account);
              };
              
              const __genDropdown = (list) => (resolve, reject) =>
              {
                    let length = list.length;
                    setTimeout(() => {
                        try {
                            list.map((i) => {
                                let options = document.createElement('option');
                                options.value = i;
                                options.innerHTML = String(i);
                                dropdown.appendChild(options);
                            })
                            
                            resolve(true);
                        } catch(err) {
                            console.log(err);
                            reject(false);
                        }
                    })
              }

              return new Promise(__genDropdown(list));
          })
          .catch((err) => { console.log(`After connectRPC:`); console.log(err); })
    }

    document.getElementById('accRefresh').onclick = allAccounts();
})
