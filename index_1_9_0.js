'use strict';

(function () {
    var timer, capitalization;
    var networkId = [1, 3, 5]; // main, ropsten, goerli
    var explorer = ['https://etherscan.io', 'https://ropsten.etherscan.io', 'https://goerli.etherscan.io'];
    var address = '0x3dDee7CdF8D71490b518b1E6e6f2198433636903';
    var abi = [
        'function balanceOf(address) view returns (uint256)',
        'function dividendsOf(address) view returns (uint256)',
        'function buy(address) payable',
        'function withdraw()',
        'function reinvest()',
        'event Profit(uint256)',
        'event Withdraw(address indexed, uint256)',
        'event Transfer(address indexed, address indexed, uint256)'
    ];
    var decimals = '1000000000000000000';
    var price = ethers.utils.parseUnits('2000000000000000', 0);
    var refRequirement = ethers.utils.parseUnits('1000000000', 0);
    var loading = true, network = -1, contract, account;

    window.onload = function () {
        setInterval(setTimer, 200);
        setCapitalization();
        setUrl();

        document.getElementById('connect').onclick = function () {
            ethereum.enable().catch(console.log);
        };
        document.getElementById('buy').onclick = buy;
        document.getElementById('reinvest').onclick = reinvest;
        document.getElementById('withdraw').onclick = withdraw;
        document.getElementById('eth').oninput = setExg;
        document.getElementById('exg').oninput = setEth;

        loadEthers();
    };

    function setTimer() {
        var seconds = Math.trunc((1688800000 - new Date().getTime() / 1000));
        if (seconds < 0) {
            seconds = seconds % 86400 + 86400;
        }
        if (timer === seconds) {
            return;
        }
        timer = seconds;
        var days = Math.trunc(seconds / 86400);
        document.getElementById('topTimerDays').innerHTML = days;
        document.getElementById('topTimerDaysHint').innerHTML = days === 1 ? 'day' : 'days';
        seconds -= days * 86400;
        var hours = Math.trunc(seconds / 3600);
        document.getElementById('topTimerHours').innerHTML = hours;
        document.getElementById('topTimerHoursHint').innerHTML = hours === 1 ? 'hour' : 'hours';
        seconds -= hours * 3600;
        var minutes = Math.trunc(seconds / 60);
        document.getElementById('topTimerMinutes').innerHTML = minutes;
        document.getElementById('topTimerMinutesHint').innerHTML = minutes === 1 ? 'minute' : 'minutes';
        seconds = Math.trunc(seconds - minutes * 60);
        document.getElementById('topTimerSeconds').innerHTML = seconds;
        document.getElementById('topTimerSecondsHint').innerHTML = seconds === 1 ? 'second' : 'seconds';
    }

    function setCapitalization() {
        if (!capitalization) {
            setWidth(1000e18);
            capitalization = true;
            setTimeout(setCapitalization, 500);
            return;
        }

        var url = 'https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=' +
            address + '&apikey=6KYMVV3GRFU2MSXKJKXEMHUNFD52ME3EIV';
        fetch(url).then(function (response) {
            if (!response.ok) {
                response.text().then(console.error);
                throw new Error(response.status);
            }
            return response.json();
        }).then(function (json) {
            if (json.status !== '1') {
                throw new Error(json.status + ': ' + json.message);
            }
            setWidth(json.result);
            setTimeout(setCapitalization, 600000);
        }).catch(function (error) {
            console.error(error);
            setTimeout(setCapitalization, 100000);
        });

        function setWidth(totalSupply) {
            var eth = (totalSupply / 1e18 * 0.002).toFixed(3);
            document.getElementById('topCapitalizationEth').innerHTML = eth + ' eth';
            var exg = (totalSupply / 1e18).toFixed(1);
            document.getElementById('topCapitalizationExg').innerHTML = exg + ' exg';
            document.getElementById('topCapitalizationBar').style.width = (exg / 10000 * 100) + '%';
        }
    }

    function setUrl() {
        var url = 'https://api.etherscan.io/api?module=proxy&action=eth_getStorageAt&address=' +
            address + '&position=0x0A&tag=latest&apikey=6KYMVV3GRFU2MSXKJKXEMHUNFD52ME3EIV';
        fetch(url).then(function (response) {
            if (!response.ok) {
                response.text().then(console.error);
                throw new Error(response.status);
            }
            return response.json();
        }).then(function (json) {
            json = json.result;
            var i = 2;
            var url = '';
            while (i < json.length) {
                var c = json.substring(i, i + 2);
                if (c === '00') {
                    break;
                }
                url += String.fromCharCode('0x' + c);
                i += 2;
            }
            url = ' : <a href="https://' + url + '" target="_blank">' + url + '</a>';
            document.getElementById('mainUrl').innerHTML = url;
        }).catch(function (error) {
            console.error(error);
            setTimeout(setUrl, 100000);
        });
    }

    function loadEthers() {
        if (!window.ethereum) {
            var hint = 'Don\'t have web3? Try ' +
                '<a target="_blank" href="https://wallet.exglos.com">wallet.exglos.com</a>!';
            return setLoading(false, hint);
        }
        try {
            window.provider = new ethers.providers.Web3Provider(window.ethereum);
        } catch (error) {
            return setLoading(false, error.toString());
        }
        provider.getNetwork().then(function (providerNetwork) {
            providerNetwork = providerNetwork.chainId;
            network = networkId.length - 1;
            while (network >= 0) {
                if (networkId[network] === providerNetwork) {
                    break;
                }
                network--;
            }
            if (network < 0) {
                return setLoading(false, 'switch to the main or goerli network');
            }
            contract = new ethers.Contract(address, abi, provider.getSigner());
            contract.on('Profit', function (increaseWeiPerExg, event) {
                loadAccountData();
            });
            contract.on('Withdraw', function (holder, wei, event) {
                if (holder === account) {
                    loadAccountData();
                }
            });
            contract.on('Transfer', function (from, to, exg, event) {
                if (from === account || to === account) {
                    loadAccountData();
                }
            });
            loadAccount();
        }).catch(function (error) {
            return setLoading(false, error.toString());
        });

        if (ethereum.on) {
            ethereum.on('chainChanged', function () {
                window.location.reload();
            });
            ethereum.on('accountsChanged', function () {
                setLoading(true);
                clear();
                loadAccount();
            });
        }

        function loadAccount() {
            provider.getSigner().getAddress().then(function (address) {
                account = address;
                setLoading(false, true);
                loadAccountData();
            }).catch(function (error) {
                account = null;
                setLoading(false, false);
            });
        }
    }

    function loadAccountData() {
        if (network < 0 || !contract || !account) {
            return;
        }
        contract.balanceOf(account).then(function (balance) {
            if (balance.gte(refRequirement)) {
                document.getElementById('ref').innerHTML = 'ref link: exglos.com?ref=' + account;
            } else {
                document.getElementById('ref').innerHTML = '';
            }
            balance = ethers.utils.formatEther(balance);
            document.getElementById('balance').innerHTML = 'balance ' + balance + ' exg';
        }).catch(console.error);
        contract.dividendsOf(account).then(function (dividends) {
            dividends = ethers.utils.formatEther(dividends);
            document.getElementById('dividends').innerHTML = 'dividends ' + dividends + ' eth';
        }).catch(console.error);
    }

    function buy(wait) {
        if (loading) {
            if (wait === true) {
                setTimeout(function () {
                    buy(true);
                }, 200);
            }
            return;
        } else if (!window.ethereum) {
            return document.getElementById('hint').innerHTML = 'use ethereum browser';
        } else if (network < 0) {
            return document.getElementById('hint').innerHTML = 'switch the network';
        } else if (!account) {
            return ethereum.enable().then(function () {
                buy(true);
            });
        }
        var eth;
        try {
            eth = ethers.utils.parseUnits(document.getElementById('eth').value);
            if (eth.lte(0)) {
                throw 'non-positive value';
            }
        } catch (error) {
            console.log(error);
            return document.getElementById('hint').innerHTML = 'enter a positive number';
        }
        setLoading(true);
        document.getElementById('hint').innerHTML = '';
        provider.getBalance(account).then(function (balance) {
            if (balance.isZero()) {
                document.getElementById('hint').innerHTML = 'zero eth balance';
                throw 'zero eth';
            } else if (eth.gt(balance)) {
                document.getElementById('eth').value = ethers.utils.formatEther(balance);
                setExg();
                document.getElementById('hint').innerHTML = 'not enough eth balance';
                throw 'not enough eth';
            }
            var ref = parse('ref');
            if (ref === 'no') {
                ref = ethers.constants.AddressZero;
            } else if (ref === 'exglosnet') {
                ref = '0xC5E4045E291EE6a414beb298310fF41b86D53666';
            } else if (ref === 'hyipcheck') {
                ref = '0xE19299E010a3c7870019a9B0E958DD138284A044';
            }
            if (!ethers.utils.isAddress(ref)) {
                ref = '0xE974e991668CDEAF98e03A2154363a8f20494909';
            }
            return contract.buy(ref, {value: eth});
        }).then(function (txResponse) {
            window.open(explorer[network] + '/tx/' + txResponse.hash);
            setLoading(false, true);
            txResponse.wait().then(function (response) {
                alert('tx ' + response.transactionHash + ' is confirmed!');
                loadAccountData();
            }).catch(function (error) {
                console.log(error);
            });
        }).catch(function (error) {
            setLoading(false, true);
            console.log(error);
        });
    }

    function reinvest(wait) {
        if (loading) {
            if (wait === true) {
                setTimeout(function () {
                    reinvest(true);
                }, 200);
            }
            return;
        } else if (!window.ethereum) {
            return document.getElementById('hint').innerHTML = 'use ethereum browser';
        } else if (network < 0) {
            return document.getElementById('hint').innerHTML = 'switch the network';
        } else if (!account) {
            return ethereum.enable().then(function () {
                reinvest(true);
            });
        }
        setLoading(true);
        document.getElementById('hint').innerHTML = '';
        contract.dividendsOf(account).then(function (dividends) {
            if (dividends.isZero()) {
                document.getElementById('hint').innerHTML = 'zero dividends';
                throw 'zero dividends';
            }
            return contract.reinvest();
        }).then(function (txResponse) {
            window.open(explorer[network] + '/tx/' + txResponse.hash);
            setLoading(false, true);
            txResponse.wait().then(function (response) {
                alert('tx ' + response.transactionHash + ' is confirmed!');
                loadAccountData();
            }).catch(function (error) {
                console.log(error);
            });
        }).catch(function (error) {
            setLoading(false, true);
            console.log(error);
        });
    }

    function withdraw(wait) {
        if (loading) {
            if (wait === true) {
                setTimeout(function () {
                    withdraw(true);
                }, 200);
            }
            return;
        } else if (!window.ethereum) {
            return document.getElementById('hint').innerHTML = 'use ethereum browser';
        } else if (network < 0) {
            return document.getElementById('hint').innerHTML = 'switch the network';
        } else if (!account) {
            return ethereum.enable().then(function () {
                withdraw(true);
            });
        }
        setLoading(true);
        document.getElementById('hint').innerHTML = '';
        contract.dividendsOf(account).then(function (dividends) {
            if (dividends.isZero()) {
                document.getElementById('hint').innerHTML = 'zero dividends';
                throw 'zero dividends';
            }
            return contract.withdraw();
        }).then(function (txResponse) {
            window.open(explorer[network] + '/tx/' + txResponse.hash);
            setLoading(false, true);
            txResponse.wait().then(function (response) {
                alert('tx ' + response.transactionHash + ' is confirmed!');
                loadAccountData();
            }).catch(function (error) {
                console.log(error);
            });
        }).catch(function (error) {
            setLoading(false, true);
            console.log(error);
        });
    }

    function setExg() {
        document.getElementById('hint').innerHTML = '';
        try {
            var eth = ethers.utils.parseUnits(document.getElementById('eth').value);
            if (eth.lte(0)) {
                document.getElementById('exg').value = '';
                document.getElementById('hint').innerHTML = 'enter a positive value';
                return;
            }
            var exg = eth.mul(decimals).div(price);
            document.getElementById('exg').value = ethers.utils.formatEther(exg);
        } catch (error) {
            console.log(error);
            document.getElementById('exg').value = '';
            document.getElementById('hint').innerHTML = 'enter a number';
        }
    }

    function setEth() {
        document.getElementById('hint').innerHTML = '';
        try {
            var exg = ethers.utils.parseUnits(document.getElementById('exg').value);
            if (exg.lte(0)) {
                document.getElementById('eth').value = '';
                document.getElementById('hint').innerHTML = 'enter a positive value';
                return;
            }
            var eth = exg.mul(price).div(decimals);
            document.getElementById('eth').value = ethers.utils.formatEther(eth);
        } catch (error) {
            console.log(error);
            document.getElementById('eth').value = '';
            document.getElementById('hint').innerHTML = 'enter a number';
        }
    }

    function setLoading(isLoading, message) {
        loading = isLoading;
        if (loading) {
            document.getElementById('connect').style.display = 'none';
            document.getElementById('message').innerHTML = 'loading...';
            document.getElementById('message').style.display = 'block';
        } else {
            if (message === false) {
                document.getElementById('message').style.display = 'none';
                document.getElementById('connect').style.display = 'block';
            } else {
                document.getElementById('connect').style.display = 'none';
                if (message === true) {
                    document.getElementById('message').innerHTML = '';
                    document.getElementById('message').style.display = 'none';
                } else {
                    document.getElementById('message').innerHTML = message;
                    document.getElementById('message').style.display = 'block';
                }
            }
        }
    }

    function clear() {
        document.getElementById('balance').innerHTML = '';
        document.getElementById('eth').value = '';
        document.getElementById('exg').value = '';
        document.getElementById('hint').innerHTML = '';
        document.getElementById('dividends').innerHTML = '';
        document.getElementById('ref').innerHTML = '';
    }

    function parse(query) {
        var startIndex = window.location.search.indexOf(query + '=');
        if (startIndex < 0) {
            return null;
        }
        startIndex = startIndex + query.length + 1;
        var stopIndex = window.location.search.indexOf('&', startIndex);
        if (stopIndex < 0) {
            return window.location.search.substring(startIndex);
        } else {
            return window.location.search.substring(startIndex, stopIndex);
        }
    }
})();