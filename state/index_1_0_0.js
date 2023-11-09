'use strict';

(function () {
    var ready, internalReady;
    var deposits, other, dividends, expenses; // hash, value, description
    var sales; // count, price, value

    window.onload = function () {
        initButton('deposits');
        initButton('sales');
        initButton('other');
        initButton('dividends');
        initButton('expenses');

        fillData();
        print();
        readTxs();
        readInternalTxs();
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
            '&address=0x5B764b71D601bbD97434696C9F53EE2133F7E1cf&startblock=18536000' +
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
            if (ready) {
                return;
            }
            for (var i = 0; i < json.length; i++) {
                if (json[i].isError !== '0') {
                    console.error(json[i]);
                } else if (json[i].to === '0x5b764b71d601bbd97434696c9f53ee2133f7e1cf') {
                    deposits.push({
                        hash: json[i].hash,
                        value: ethers.utils.parseUnits(json[i].value, 'wei')
                    });
                } else if (json[i].functionName === 'profit()') {
                    var value = ethers.utils.parseUnits(json[i].gasPrice, 'wei');
                    value = value.mul(ethers.utils.parseUnits(json[i].gasUsed, 'wei'));
                    value = value.add(ethers.utils.parseUnits(json[i].value, 'wei'));
                    dividends.push({
                        hash: json[i].hash,
                        value: value
                    });
                } else {
                    var value = ethers.utils.parseUnits(json[i].gasPrice, 'wei');
                    value = value.mul(ethers.utils.parseUnits(json[i].gasUsed, 'wei'));
                    value = value.add(ethers.utils.parseUnits(json[i].value, 'wei'));
                    expenses.push({
                        hash: json[i].hash,
                        value: value
                    });
                }
            }
            ready = true;
            if (ready && internalReady) {
                print();
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function readInternalTxs() {
        var url = 'https://api.etherscan.io/api?module=account&action=txlistinternal' +
            '&address=0x5B764b71D601bbD97434696C9F53EE2133F7E1cf&startblock=18536000' +
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
            if (internalReady) {
                return;
            }
            var currentSalesRound = sales[sales.length - 1];
            for (var i = 0; i < json.length; i++) {
                if (json[i].isError !== '0') {
                    console.error(json[i]);
                } else if (json[i].from === '0x3ddee7cdf8d71490b518b1e6e6f2198433636903') {
                    currentSalesRound.count++;
                    currentSalesRound.value =
                        currentSalesRound.value.add(ethers.utils.parseUnits(json[i].value, 'wei'));
                } else if (json[i].to === '0x5b764b71d601bbd97434696c9f53ee2133f7e1cf') {
                    other.push({
                        hash: json[i].hash,
                        value: ethers.utils.parseUnits(json[i].value, 'wei')
                    });
                } else {
                    console.error(json[i]);
                }
            }
            internalReady = true;
            if (ready && internalReady) {
                print();
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function print() {
        var sum = ethers.constants.Zero;
        var container = document.getElementById('depositsList');
        container.innerHTML = '';
        for (var i = deposits.length - 1; i >= 0; i--) {
            sum = sum.add(deposits[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(deposits[i].value);
            div.append(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (deposits[i].description ? deposits[i].description + ', ' : '') +
                formatHash(deposits[i].hash);
            div.append(h4);
            container.append(div);
        }
        document.getElementById('deposits').innerHTML = formatWei(sum);
        var inputs = sum;

        sum = ethers.constants.Zero;
        container = document.getElementById('salesList');
        container.innerHTML = '';
        for (var i = sales.length - 1; i >= 0; i--) {
            sum = sum.add(sales[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(sales[i].value);
            div.append(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = sales[i].count + ' purchases, price ' + sales[i].price;
            div.append(h4);
            container.append(div);
        }
        document.getElementById('sales').innerHTML = formatWei(sum);
        inputs = inputs.add(sum);

        sum = ethers.constants.Zero;
        container = document.getElementById('otherList');
        container.innerHTML = '';
        for (var i = other.length - 1; i >= 0; i--) {
            sum = sum.add(other[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(other[i].value);
            div.append(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (other[i].description ? other[i].description + ', ' : '') +
                formatHash(other[i].hash);
            div.append(h4);
            container.append(div);
        }
        document.getElementById('other').innerHTML = formatWei(sum);
        inputs = inputs.add(sum);
        document.getElementById('inputs').innerHTML = formatWei(inputs);

        sum = ethers.constants.Zero;
        var container = document.getElementById('dividendsList');
        container.innerHTML = '';
        for (var i = dividends.length - 1; i >= 0; i--) {
            sum = sum.add(dividends[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(dividends[i].value, true);
            div.append(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (dividends[i].description ? dividends[i].description + ', ' : '') +
                formatHash(dividends[i].hash);
            div.append(h4);
            container.append(div);
        }
        document.getElementById('dividends').innerHTML = formatWei(sum, true);
        var outputs = sum;

        sum = ethers.constants.Zero;
        var container = document.getElementById('expensesList');
        container.innerHTML = '';
        for (var i = expenses.length - 1; i >= 0; i--) {
            sum = sum.add(expenses[i].value);
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.innerHTML = formatWei(expenses[i].value, true);
            div.append(p);
            var h4 = document.createElement('h4');
            h4.innerHTML = (expenses[i].description ? expenses[i].description + ', ' : '') +
                formatHash(expenses[i].hash);
            div.append(h4);
            container.append(div);
        }
        document.getElementById('expenses').innerHTML = formatWei(sum, true);
        outputs = outputs.add(sum);
        document.getElementById('outputs').innerHTML = formatWei(outputs, true);

        document.getElementById('balance').innerHTML = formatWei(inputs.sub(outputs));
    }

    function formatWei(value, negate) {
        value = ethers.utils.formatEther(value).split('.');
        while (value[1].length < 18) {
            value[1] += '0';
        }
        return (negate ? '-' : '') + value[0] + '.' + value[1].substring(0, 3) +
            '<span class="small">' + value[1].substring(3) + '</span>';
    }

    function formatHash(value) {
        return '<a href="https://etherscan.io/tx/' + value + '" target="_blank">' +
            value.substring(0, 8) + '..' + value.substring(62) + '</a>';
    }

    function fillData() {
        deposits = [{
            hash: '0xc58645950319ad5d5543cb930e1aaab2de9f8bdafedc947cbc16d30e634b1db8',
            value: ethers.utils.parseEther('0.479444')
        }, {
            hash: '0x26a0d370ccc05a22a13b85d9efeb976616055ae9e25693e4f7f79cef52147e0b',
            value: ethers.utils.parseEther('0.049279497772226')
        }];
        sales = [{
            count: 20,
            price: 0.002,
            value: ethers.utils.parseEther('2.146292891017674449')
        }, {
            count: 3,
            price: 0.004,
            value: ethers.utils.parseEther('0.257100174004222008')
        }];
        other = [];
        dividends = [{
            hash: '0x699a85c4b0f017e64446b0ea6e2c09f89e89e3e188dac0e341cfa60d83319574',
            value: ethers.utils.parseEther('0.010790229395029134'),
            description: '0.000199 eth/exg'
        }, {
            hash: '0x03db0da10306b490b769c663e773f5428596103b0e02c02fb27cf844a703a157',
            value: ethers.utils.parseEther('0.100178428'),
            description: '0.0004 eth/exg'
        }, {
            hash: '0xa6a91c836928c824612523743238bb6278bd3e5fd66aabd54e74a437b3fd6219',
            value: ethers.utils.parseEther('0.100147051755259002'),
            description: '0.0004 eth/exg'
        }, {
            hash: '0xe378d80c623a2cf8a9a18a1487dcb695c6dc7fe651d1525b66b12a7e7959cbaf',
            value: ethers.utils.parseEther('0.070267642'),
            description: '0.000278 eth/exg'
        }, {
            hash: '0x46d42e8e343c0526c44960b064e287bd7af3c32325aae77205a070184d80b3f4',
            value: ethers.utils.parseEther('0.160475808'),
            description: '0.000538 eth/exg'
        }, {
            hash: '0x8785bfe2fece1338c52d2de8e1a770422a5ee962dccaac27e1cdec7e4ba0d462',
            value: ethers.utils.parseEther('0.700921878'),
            description: '0.000936 eth/exg'
        }, {
            hash: '0x2f67cfd714f2523c842fb66689984cb56e27f121e0f03a387d6286ebced16906',
            value: ethers.utils.parseEther('0.300535284'),
            description: '0.000283 eth/exg'
        }];
        expenses = [{
            hash: '0x1ba58b69b3b567205be79e579e934463e1104a9f754284c129e18f3d6a33692c',
            value: ethers.utils.parseEther('0.02021215530733306'),
            description: '<a href="https://etherscan.io/address/0x3ddee7cdf8d71490b518b1e6e6f2198433636903" target="_blank">exglos contract</a> creation'
        }, {
            hash: '0x886e96ae72a6203700fa1b483468ce5c7fdb469dd52f1ffad1e2da7bb2ab8acf',
            value: ethers.utils.parseEther('0.020517421187449822'),
            description: 'domain <a href="https://exglos.com" target="_blank">exglos.com</a>'
        }, {
            hash: '0x4307a81bf8534d6ba6220213e1946e2869be029f9cc66983fec6fbca6f851acd',
            value: ethers.utils.parseEther('0.000351032'),
            description: 'set canonical url'
        }, {
            hash: '0xf686497e5a8f7af359ec5c880153fddf51bcfd78e2ab499a70136420eeafa918',
            value: ethers.utils.parseEther('0.071210822691926'),
            description: '<a href="https://hyip-check.ru/project/5649" target="_blank">monitoring</a>'
        }, {
            hash: '0xef6708df4fa43f37319151f6a5e9791fe2f68e3b9728aaa3e459fd2b573790ed',
            value: ethers.utils.parseEther('0.070233455861884'),
            description: 'Jo salary 2022'
        }, {
            hash: '0x1ca90df70d9f3072727c3071c61ea309d18cc7ea919bbd7ebd1f5a355e6f8d36',
            value: ethers.utils.parseEther('0.080110226322878'),
            description: '<a href="https://www.mabnews.com/exglos.com-review.html" target="_blank">blog</a>'
        }, {
            hash: '0x8f6089c37e0df6d6ae72eafa62b011a8203f40886044acf375eeb3907160f47c',
            value: ethers.utils.parseEther('0.100105'),
            description: '<a href="https://onlinebitz.net/exglos.com-review" target="_blank">another blog</a>'
        }, {
            hash: '0x7ddbf89bfaa7dfc1055d33a5caf8f7067baf94e1254682a43f226607d50f1c4f',
            value: ethers.utils.parseEther('0.010259180000000002'),
            description: '10% platform fee for audit'
        }, {
            hash: '0x01580ffb51087459a4ebfbe68d74c612fd0ccfc9bb461ea53a80a143cfd8b8ef',
            value: ethers.utils.parseEther('0.100189'),
            description: '<a href="https://github.com/exglos/contract/blob/main/contracts/audits/byNaftaliMurgor.md" target="_blank">smart contract audit</a>'
        }, {
            hash: '0x0817aa9dcf255d81d332211af0e50e548781677429e07958fa73455f5b95df29',
            value: ethers.utils.parseEther('0.12542'),
            description: 'building <a href="https://start.exglos.com" target="_blank">start.exglos.com</a>'
        }, {
            hash: '0x3580da3d925ad736bd99a9048c9cdf320dfbc4ba05b66fb406a3df0989440a13',
            value: ethers.utils.parseEther('0.000693825'),
            description: 'ens unsuccessful commit'
        }, {
            hash: '0xe465f83882fc572b340258f502e04cb56d3fefbb402ffa0df2677835b0546019',
            value: ethers.utils.parseEther('0.000740272'),
            description: 'ens successful commit'
        }, {
            hash: '0xd28f341850fcf83452842605dfadf58a99c15f6e75a58f8475c6a21a2d272e3a',
            value: ethers.utils.parseEther('0.033055870791071075').sub(
                ethers.utils.parseEther('0.002631284617370097')),
            description: 'registration <a href="https://etherscan.io/enslookup-search?search=exglos.eth" target="_blank">exglos.eth</a>'
        }, {
            hash: '0x5568932e0e7bc5fceb67689ca1f2dcf96dff26bf7e18902385642160a97a9db1',
            value: ethers.utils.parseEther('0.002485512297907646'),
            description: 'reverse ens'
        }, {
            hash: '0xc03726ce97c86b8ee70b6ab436d7816ed0735d066daadc594ccb02565f913484',
            value: ethers.utils.parseEther('0.00059528'),
            description: 'set price 0.004'
        }, {
            hash: '0x4b4948f941749cca90fdbaa5af8ffefe6053378a3c781e074d5b8109261832cb',
            value: ethers.utils.parseEther('0.006375690215145'),
            description: 'to contest winner'
        }, {
            hash: '0x26603cf756a19638dcc0bf4616eabf5151e68f5ae515bacb7ce1c11c36121f5a',
            value: ethers.utils.parseEther('0.070315'),
            description: '50% of development <a href="https://ens.exglos.com" target="_blank">ens.exglos.com</a>'
        }];
    }
})();