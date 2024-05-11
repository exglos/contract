'use strict';

(function () {
    var loaded = {
        txs: false,
        internalTxs: false,
        block: false
    };
    var deposits, other, dividends, expenses; // hash, value, description
    var sales; // count, price, value
    var block; // n, timestamp
    var preloadedBlock;

    window.onload = function () {
        initButton('deposits');
        initButton('sales');
        initButton('other');
        initButton('dividends');
        initButton('expenses');

        fillData();
        readTxs();
        readInternalTxs();
        readBlock();
    };

    function initButton(item) {
        document.getElementById(item + 'Button').onclick = function () {
            if (document.getElementById(item + 'List').style.display === 'block') {
                document.getElementById(item + 'List').style.display = 'none';
            } else {
                document.getElementById(item + 'List').style.display = 'block';
            }
        };
    }

    function readTxs() {
        var url = 'https://api.etherscan.io/api?module=account&action=txlist' +
            '&address=0x5B764b71D601bbD97434696C9F53EE2133F7E1cf&startblock=' + preloadedBlock +
            '&apikey=6KYMVV3GRFU2MSXKJKXEMHUNFD52ME3EIV';
        fetch(url).then(function (response) {
            if (!response.ok) {
                response.text().then(console.error);
                throw new Error(response.status);
            }
            return response.json();
        }).then(function (json) {
            if (json.status !== '1') {
                console.log(json.message);
            }
            json = json.result;
            for (var i = 0; i < json.length; i++) {
                if (json[i].isError !== '0') {
                    console.error(json[i]);
                } else if (json[i].to === '0x5b764b71d601bbd97434696c9f53ee2133f7e1cf') {
                    deposits.push({
                        hash: json[i].hash,
                        value: new BigNumber(json[i].value)
                    });
                } else if (json[i].functionName === 'profit()') {
                    dividends.push({
                        hash: json[i].hash,
                        value: new BigNumber(json[i].gasPrice).times(json[i].gasUsed).plus(json[i].value)
                    });
                } else {
                    expenses.push({
                        hash: json[i].hash,
                        value: new BigNumber(json[i].gasPrice).times(json[i].gasUsed).plus(json[i].value)
                    });
                }
            }
            loaded.txs = true;
            if (loaded.txs && loaded.internalTxs && loaded.block) {
                print();
            }
        }).catch(function (error) {
            console.error(error);
            fillData();
            print();
        });
    }

    function readInternalTxs() {
        var url = 'https://api.etherscan.io/api?module=account&action=txlistinternal' +
            '&address=0x5B764b71D601bbD97434696C9F53EE2133F7E1cf&startblock=' + preloadedBlock +
            '&apikey=6KYMVV3GRFU2MSXKJKXEMHUNFD52ME3EIV';
        fetch(url).then(function (response) {
            if (!response.ok) {
                response.text().then(console.error);
                throw new Error(response.status);
            }
            return response.json();
        }).then(function (json) {
            if (json.status !== '1') {
                console.log(json.message);
            }
            json = json.result;
            var currentSalesRound = sales[sales.length - 1];
            for (var i = 0; i < json.length; i++) {
                if (json[i].isError !== '0') {
                    console.error(json[i]);
                } else if (json[i].from === '0x3ddee7cdf8d71490b518b1e6e6f2198433636903') {
                    currentSalesRound.count++;
                    currentSalesRound.value = currentSalesRound.value.plus(json[i].value);
                } else if (json[i].to === '0x5b764b71d601bbd97434696c9f53ee2133f7e1cf') {
                    other.push({
                        hash: json[i].hash,
                        value: new BigNumber(json[i].value)
                    });
                } else {
                    console.error(json[i]);
                }
            }
            loaded.internalTxs = true;
            if (loaded.txs && loaded.internalTxs && loaded.block) {
                print();
            }
        }).catch(function (error) {
            console.error(error);
            fillData();
            print();
        });
    }

    function readBlock() {
        block.timestamp = (new Date().getTime() / 1000).toFixed();
        var url = 'https://api.etherscan.io/api?module=block&action=getblocknobytime' +
            '&timestamp=' + block.timestamp +
            '&closest=before&apikey=6KYMVV3GRFU2MSXKJKXEMHUNFD52ME3EIV';
        fetch(url).then(function (response) {
            if (!response.ok) {
                response.text().then(console.error);
                throw new Error(response.status);
            }
            return response.json();
        }).then(function (json) {
            if (json.status !== '1' || isNaN(json.result)) {
                throw new Error(json.message);
            } else {
                block.n = json.result;
            }
            loaded.block = true;
            if (loaded.txs && loaded.internalTxs && loaded.block) {
                print();
            }
        }).catch(function (error) {
            console.error(error);
            fillData();
            print();
        });
    }

    function print() {
        var sum = new BigNumber(0);
        var container = document.getElementById('depositsList');
        container.innerHTML = '';
        for (var i = deposits.length - 1; i >= 0; i--) {
            sum = sum.plus(deposits[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(deposits[i].value);
            div.appendChild(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (deposits[i].description ? deposits[i].description + ', ' : '') +
                formatHash(deposits[i].hash);
            div.appendChild(h4);
            container.appendChild(div);
        }
        document.getElementById('deposits').innerHTML = formatWei(sum);
        var inputs = sum;

        sum = new BigNumber(0);
        container = document.getElementById('salesList');
        container.innerHTML = '';
        for (var i = sales.length - 1; i >= 0; i--) {
            sum = sum.plus(sales[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(sales[i].value);
            div.appendChild(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = sales[i].count + ' purchases, price ' + sales[i].price;
            div.appendChild(h4);
            container.appendChild(div);
        }
        document.getElementById('sales').innerHTML = formatWei(sum);
        inputs = inputs.plus(sum);

        sum = new BigNumber(0);
        container = document.getElementById('otherList');
        container.innerHTML = '';
        for (var i = other.length - 1; i >= 0; i--) {
            sum = sum.plus(other[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(other[i].value);
            div.appendChild(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (other[i].description ? other[i].description + ', ' : '') +
                formatHash(other[i].hash);
            div.appendChild(h4);
            container.appendChild(div);
        }
        document.getElementById('other').innerHTML = formatWei(sum);
        inputs = inputs.plus(sum);
        document.getElementById('inputs').innerHTML = formatWei(inputs);

        sum = new BigNumber(0);
        var container = document.getElementById('dividendsList');
        container.innerHTML = '';
        for (var i = dividends.length - 1; i >= 0; i--) {
            sum = sum.plus(dividends[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(dividends[i].value, true);
            div.appendChild(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (dividends[i].description ? dividends[i].description + ', ' : '') +
                formatHash(dividends[i].hash);
            div.appendChild(h4);
            container.appendChild(div);
        }
        document.getElementById('dividends').innerHTML = formatWei(sum, true);
        var outputs = sum;

        sum = new BigNumber(0);
        var container = document.getElementById('expensesList');
        container.innerHTML = '';
        for (var i = expenses.length - 1; i >= 0; i--) {
            sum = sum.plus(expenses[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(expenses[i].value, true);
            div.appendChild(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (expenses[i].description ? expenses[i].description + ', ' : '') +
                formatHash(expenses[i].hash);
            div.appendChild(h4);
            container.appendChild(div);
        }
        document.getElementById('expenses').innerHTML = formatWei(sum, true);
        outputs = outputs.plus(sum);
        document.getElementById('outputs').innerHTML = formatWei(outputs, true);

        document.getElementById('balance').innerHTML = formatWei(inputs.minus(outputs));

        var date = new Date(block.timestamp * 1000 - new Date().getTimezoneOffset() * 60000);
        document.getElementById('time').innerHTML = date.toISOString().substr(0, 19) +
            ', block ' + block.n;
    }

    function formatWei(value, negate) {
        if (negate) {
            value = value.negated();
        }
        value = value.shiftedBy(-18).toFixed(18);
        return value.substring(0, value.length - 15) +
            '<span class="small">' + value.substring(value.length - 15) + '</span>';
    }

    function formatHash(value) {
        return '<a href="https://etherscan.io/tx/' + value + '" target="_blank">' +
            value.substring(0, 8) + '..' + value.substring(62) + '</a>';
    }

    function fillData() {
        deposits = [{
            hash: '0xc58645950319ad5d5543cb930e1aaab2de9f8bdafedc947cbc16d30e634b1db8',
            value: new BigNumber('0.479444').shiftedBy(18)
        }, {
            hash: '0x26a0d370ccc05a22a13b85d9efeb976616055ae9e25693e4f7f79cef52147e0b',
            value: new BigNumber('0.049279497772226').shiftedBy(18)
        }];
        sales = [{
            count: 20,
            price: 0.002,
            value: new BigNumber('2.146292891017674449').shiftedBy(18)
        }, {
            count: 4,
            price: 0.004,
            value: new BigNumber('0.268920174004222008').shiftedBy(18)
        }];
        other = [];
        dividends = [{
            hash: '0x699a85c4b0f017e64446b0ea6e2c09f89e89e3e188dac0e341cfa60d83319574',
            value: new BigNumber('0.010790229395029134').shiftedBy(18),
            description: '0.000199 eth/exg'
        }, {
            hash: '0x03db0da10306b490b769c663e773f5428596103b0e02c02fb27cf844a703a157',
            value: new BigNumber('0.100178428').shiftedBy(18),
            description: '0.0004 eth/exg'
        }, {
            hash: '0xa6a91c836928c824612523743238bb6278bd3e5fd66aabd54e74a437b3fd6219',
            value: new BigNumber('0.100147051755259002').shiftedBy(18),
            description: '0.0004 eth/exg'
        }, {
            hash: '0xe378d80c623a2cf8a9a18a1487dcb695c6dc7fe651d1525b66b12a7e7959cbaf',
            value: new BigNumber('0.070267642').shiftedBy(18),
            description: '0.000278 eth/exg'
        }, {
            hash: '0x46d42e8e343c0526c44960b064e287bd7af3c32325aae77205a070184d80b3f4',
            value: new BigNumber('0.160475808').shiftedBy(18),
            description: '0.000538 eth/exg'
        }, {
            hash: '0x8785bfe2fece1338c52d2de8e1a770422a5ee962dccaac27e1cdec7e4ba0d462',
            value: new BigNumber('0.700921878').shiftedBy(18),
            description: '0.000936 eth/exg'
        }, {
            hash: '0x2f67cfd714f2523c842fb66689984cb56e27f121e0f03a387d6286ebced16906',
            value: new BigNumber('0.300535284').shiftedBy(18),
            description: '0.000283 eth/exg'
        }, {
            hash: '0xe868cb4611690bdd767906219958a1e860d22e26503d3fc06e97dd54ad7f5de2',
            value: new BigNumber('0.70012258662519735').shiftedBy(18),
            description: '0.000611 eth/exg'
        }];
        expenses = [{
            hash: '0x1ba58b69b3b567205be79e579e934463e1104a9f754284c129e18f3d6a33692c',
            value: new BigNumber('0.02021215530733306').shiftedBy(18),
            description: '<a href="https://etherscan.io/address/0x3ddee7cdf8d71490b518b1e6e6f2198433636903" target="_blank">exglos contract</a> creation'
        }, {
            hash: '0x886e96ae72a6203700fa1b483468ce5c7fdb469dd52f1ffad1e2da7bb2ab8acf',
            value: new BigNumber('0.020517421187449822').shiftedBy(18),
            description: 'domain <a href="https://exglos.com" target="_blank">exglos.com</a>'
        }, {
            hash: '0x4307a81bf8534d6ba6220213e1946e2869be029f9cc66983fec6fbca6f851acd',
            value: new BigNumber('0.000351032').shiftedBy(18),
            description: 'set canonical url'
        }, {
            hash: '0xf686497e5a8f7af359ec5c880153fddf51bcfd78e2ab499a70136420eeafa918',
            value: new BigNumber('0.071210822691926').shiftedBy(18),
            description: '<a href="https://hyip-check.ru/project/5649" target="_blank">monitoring</a>'
        }, {
            hash: '0xef6708df4fa43f37319151f6a5e9791fe2f68e3b9728aaa3e459fd2b573790ed',
            value: new BigNumber('0.070233455861884').shiftedBy(18),
            description: 'Jo salary 2022'
        }, {
            hash: '0x1ca90df70d9f3072727c3071c61ea309d18cc7ea919bbd7ebd1f5a355e6f8d36',
            value: new BigNumber('0.080110226322878').shiftedBy(18),
            description: '<a href="https://www.mabnews.com/exglos.com-review.html" target="_blank">blog</a>'
        }, {
            hash: '0x8f6089c37e0df6d6ae72eafa62b011a8203f40886044acf375eeb3907160f47c',
            value: new BigNumber('0.100105').shiftedBy(18),
            description: '<a href="https://onlinebitz.net/exglos.com-review" target="_blank">another blog</a>'
        }, {
            hash: '0x7ddbf89bfaa7dfc1055d33a5caf8f7067baf94e1254682a43f226607d50f1c4f',
            value: new BigNumber('0.010259180000000002').shiftedBy(18),
            description: '10% platform fee for audit'
        }, {
            hash: '0x01580ffb51087459a4ebfbe68d74c612fd0ccfc9bb461ea53a80a143cfd8b8ef',
            value: new BigNumber('0.100189').shiftedBy(18),
            description: '<a href="https://github.com/exglos/contract/blob/main/contracts/audits/byNaftaliMurgor.md" target="_blank">smart contract audit</a>'
        }, {
            hash: '0x0817aa9dcf255d81d332211af0e50e548781677429e07958fa73455f5b95df29',
            value: new BigNumber('0.12542').shiftedBy(18),
            description: 'building <a href="https://start.exglos.com" target="_blank">start.exglos.com</a>'
        }, {
            hash: '0x3580da3d925ad736bd99a9048c9cdf320dfbc4ba05b66fb406a3df0989440a13',
            value: new BigNumber('0.000693825').shiftedBy(18),
            description: 'ens unsuccessful commit'
        }, {
            hash: '0xe465f83882fc572b340258f502e04cb56d3fefbb402ffa0df2677835b0546019',
            value: new BigNumber('0.000740272').shiftedBy(18),
            description: 'ens successful commit'
        }, {
            hash: '0xd28f341850fcf83452842605dfadf58a99c15f6e75a58f8475c6a21a2d272e3a',
            value: new BigNumber('0.033055870791071075').minus('0.002631284617370097').shiftedBy(18),
            description: 'registration <a href="https://etherscan.io/enslookup-search?search=exglos.eth" target="_blank">exglos.eth</a>'
        }, {
            hash: '0x5568932e0e7bc5fceb67689ca1f2dcf96dff26bf7e18902385642160a97a9db1',
            value: new BigNumber('0.002485512297907646').shiftedBy(18),
            description: 'reverse ens'
        }, {
            hash: '0xc03726ce97c86b8ee70b6ab436d7816ed0735d066daadc594ccb02565f913484',
            value: new BigNumber('0.00059528').shiftedBy(18),
            description: 'set price 0.004'
        }, {
            hash: '0x4b4948f941749cca90fdbaa5af8ffefe6053378a3c781e074d5b8109261832cb',
            value: new BigNumber('0.006375690215145').shiftedBy(18),
            description: 'to contest winner'
        }, {
            hash: '0x26603cf756a19638dcc0bf4616eabf5151e68f5ae515bacb7ce1c11c36121f5a',
            value: new BigNumber('0.070315').shiftedBy(18),
            description: '50% of development <a href="https://ens.exglos.com" target="_blank">ens.exglos.com</a>'
        }, {
            hash: '0xe63f7c4e210accb1df197503e2644f334684dbe87b571ad77b984b0034f054bf',
            value: new BigNumber('0.070084').shiftedBy(18),
            description: 'Jo salary 2023'
        }];
        block = {
            n: 19845857,
            timestamp: 1715420408
        };
        preloadedBlock = 19845857;
    }
})();