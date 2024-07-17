var balance = ethers.constants.Zero;
var price = ethers.constants.Zero;
var priceStorageAddress = '0x0000000000000000000000000000000000000000000000000000000000000001';
var profitPerExg = ethers.constants.Zero;
var profitPerExgStorageAddress = '0x0000000000000000000000000000000000000000000000000000000000000004';
var totalSupply = ethers.constants.Zero;
var totalSupplyStorageAddress = '0x0000000000000000000000000000000000000000000000000000000000000006';
var holders = new Map(); // address, {name, payouts, payoutsStorageAddress, balance, balanceStorageAddress}
var wei = ethers.utils.parseEther('1');


function print(prefix, symbol, value, address) {
    var msg = prefix;
    if (value) {
        msg += ': ' + ethers.utils.formatEther(value);
        if (symbol) {
            msg += ' ' + symbol;
        }
        msg += ' (' + ethers.utils.hexValue(value);
        if (address) {
            msg += ' at ' + address;
        }
        msg += ')';
    }
    var pre = document.createElement('pre');
    pre.innerHTML = msg;
    document.getElementById('main').append(pre);
}

function dump() {
    print('balance', 'eth', balance);
    print('price', 'eth/exg', price, priceStorageAddress);
    print('profitPerExg', null, profitPerExg, profitPerExgStorageAddress);
    print('totalSupply', 'exg', totalSupply, totalSupplyStorageAddress);
    print('holders: ');
    var n = holders.size;
    holders.forEach(function (value, key, map) {
        if (value.payouts.isZero() && value.balance.isZero()) {
            n--;
            return;
        }
        print(' ' + key + ' (' + value.name + ')');
        print('  payouts', null, value.payouts, value.payoutsStorageAddress);
        print('  balance', 'exg', value.balance, value.balanceStorageAddress);
        var divs = value.balance.mul(profitPerExg).div(wei).sub(value.payouts);
        print('  dividends', 'eth', divs);
    });
    print('non-zero holders: ' + n);
}

function check() {
    var sum = ethers.constants.Zero;
    holders.forEach(function (value, key, map) {
        sum = sum.add(value.balance);
    });
    sum = totalSupply.sub(sum);
    print('totalSupply difference ' + ethers.utils.formatEther(sum) + ' exg');

    sum = balance;
    holders.forEach(function (value, key, map) {
        sum = sum.sub(value.balance.mul(profitPerExg).div(wei).sub(value.payouts));
    });
    print('dividends reminder ' + + ethers.utils.formatEther(sum) + ' eth');
}


function profit(eth) {
    eth = ethers.utils.parseEther(eth);
    balance = balance.add(eth);
    profitPerExg = profitPerExg.add(eth.mul(wei).div(totalSupply));
}

function buy(eth, address, name, payoutsStorageAddress, balanceStorageAddress) {
    var exg = ethers.utils.parseEther(eth).mul(wei).div(price);
    totalSupply = totalSupply.add(exg);
    var holder = holders.get(address);
    if (!holder) {
        holders.set(address, {
            name: name,
            payouts: exg.mul(profitPerExg).div(wei),
            payoutsStorageAddress: payoutsStorageAddress,
            balance: exg,
            balanceStorageAddress: balanceStorageAddress
        })
    } else {
        holder.payouts = holder.payouts.add(exg.mul(profitPerExg).div(wei));
        if (payoutsStorageAddress) {
            holder.payoutsStorageAddress = payoutsStorageAddress;
        }
        holder.balance = holder.balance.add(exg);
    }
}

function withdraw(address, payoutsStorageAddress) {
    var holder = holders.get(address);
    var divs = holder.balance.mul(profitPerExg).div(wei).sub(holder.payouts);
    balance = balance.sub(divs);
    holder.payouts = holder.payouts.add(divs);
    if (payoutsStorageAddress) {
        holder.payoutsStorageAddress = payoutsStorageAddress;
    }
}

function reinvest(address, payoutsStorageAddress) {
    var holder = holders.get(address);
    var divs = holder.balance.mul(profitPerExg).div(wei).sub(holder.payouts);
    balance = balance.sub(divs);
    var exg = divs.mul(wei).div(price);
    totalSupply = totalSupply.add(exg);
    holder.payouts = holder.payouts.add(divs).add(exg.mul(profitPerExg).div(wei));
    if (payoutsStorageAddress) {
        holder.payoutsStorageAddress = payoutsStorageAddress;
    }
    holder.balance = holder.balance.add(exg);
}

function transfer(exg, sender, recipient, name, payoutsStorageAddress, balanceStorageAddress) {
    exg = ethers.utils.parseEther(exg);
    var payout = exg.mul(profitPerExg).div(wei);
    var holder = holders.get(sender);
    holder.payouts = holder.payouts.sub(payout);
    holder.balance = holder.balance.sub(exg);
    holder = holders.get(recipient);
    if (!holder) {
        holders.set(recipient, {
            name: name,
            payouts: payout,
            payoutsStorageAddress: payoutsStorageAddress,
            balance: exg,
            balanceStorageAddress: balanceStorageAddress
        })
    } else {
        holder.payouts = holder.payouts.add(payout);
        holder.balance = holder.balance.add(exg);
    }
}


// 0x1ba58b69b3b567205be79e579e934463e1104a9f754284c129e18f3d6a33692c, deploy
price = ethers.utils.parseUnits('2000000000000000', 0);

// 0xdb5929328300d1de40ba417fe51b207fb986c64eb4e6f0a2f186d5ded482f5b3
buy('0.004', '0xC5E4045E291EE6a414beb298310fF41b86D53666', 'max', undefined,
    '0xc5bce593b2d799aa070ae121f25e1d7f0f62b865df65e70965563b98ab62462b');

// 0x4307a81bf8534d6ba6220213e1946e2869be029f9cc66983fec6fbca6f851acd, set url

// 0x623dcbb73a7bd8c6df40042a93f0b70a3a4c99d1a29f71fc844c1d5a60612a91
buy('0.064', '0xE974e991668CDEAF98e03A2154363a8f20494909', 'jo', undefined,
    '0x7ab2d6afbcebf50a970f4fafbec0755b6727a2ed1f978afc4dd35b965e9879ca');

// 0x9f4b530a6327e8b7a06008bec8a27df940ded19b11ec0a50aa9e74a087a626a2
buy('0.0355', '0xE19299E010a3c7870019a9B0E958DD138284A044', 'hc', undefined,
    '0x459c9903e2238e13e719edff7ecde715f3c1bda5f2917f29a6b47edbce9182a1');

// 0x4dd130d161263c51efefe83b4750fe86d0edbc2a3a2f153bffb39395a36ee1e8
buy('0.002', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0x699a85c4b0f017e64446b0ea6e2c09f89e89e3e188dac0e341cfa60d83319574
profit('0.0105');

// 0xa52c57b798e84008fec36544540035a6f7530de7b4f1c3f1076a108cdd97b8f7
reinvest('0xE974e991668CDEAF98e03A2154363a8f20494909',
         '0x723d0bd8d1db5238ba3729b002e51e9f0c5246c81502a60fc364366050e551c9');

// 0x28a2a2dac32c0a584143ed80d8af588f6ed5dfa774b4568b8d5113d73f84bff6
buy('0.001', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0x6cfcdc520e7c083eb86bac28d0fcad351bf768f6ef7f469d0d4b5784f10709bb
buy('0.1', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0xed9337686025d850ee172b78eb1445c1a1ce1025035b5e5ad406b15be0e8ff8b
buy('0.286431279620853107', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0x03db0da10306b490b769c663e773f5428596103b0e02c02fb27cf844a703a157
profit('0.1');

// 0x6da39ccbeb1a2d3bbf5813cf4bef97ad866fe61f86b4ce2a525caa0b68d60041
withdraw('0xC5E4045E291EE6a414beb298310fF41b86D53666',
         '0x6f566db10c5cc32559179dcd9b7a57219f9aa57d48fb88890a227883bc621ffe');

// 0xbd224ed117151f0530ab83d58fa7c1e05ae9ee9df9756e0e2234a891f20b36f3
withdraw('0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0xa89625dc477bd3fe70ff475f30ab3a445ee6f27a8e49e00afc20e02028a6f718
withdraw('0xE19299E010a3c7870019a9B0E958DD138284A044',
        '0xf55cd2b40d403ffd4030d6437997689c09db9b40ddec79050bfee7e6ac6f1a36');

// 0xa6a91c836928c824612523743238bb6278bd3e5fd66aabd54e74a437b3fd6219
profit('0.1');

// 0x9c5a7618d7147846c02a0e527d5062ffd5e69780f712f80caddaf0f96d985744
withdraw('0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0x7172fd0fd7ca5f74fd486ac363b02ee27374c323040ef2a6bce88876ef7fba19
withdraw('0xE19299E010a3c7870019a9B0E958DD138284A044');

// 0x764a1c25d0979b7663cd2dbbaab7253eb0592e526d357435d55c6f07315b7660
buy('0.004', '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA', '7961C6',
    '0x5ae72fbde3a843a4a816247c0f2f27e7dc4cbf053a4c61597618de305590abb8',
    '0xd518db192acb1cfff95a54dee16ea29126606f1588c985751f3c152b00e0b4ab');

// 0xe378d80c623a2cf8a9a18a1487dcb695c6dc7fe651d1525b66b12a7e7959cbaf
profit('0.07');

// 0xf4cdc35893e317be684e0e86509380b4d1f7baee326f8e4a17326a6d8de5bbc5
withdraw('0xE19299E010a3c7870019a9B0E958DD138284A044');

// 0xda39f1804d7d5b7a13ed5a2a0a35d1ce5a5c97c688d140345087d210082789a0
withdraw('0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0x0183841f68762f4da1371d7880d6cd8e4dd50fa26affcdf5165e5716ebafb9dd
buy('0.0412', '0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0x4976c64266828d8146a0a8b6ece3b9a470032ff0530b326f6ccd1dfeea5fdfa1
buy('0.05', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0x46d42e8e343c0526c44960b064e287bd7af3c32325aae77205a070184d80b3f4
profit('0.16');

// 0x23a60027437580820d1cbf29b451b5931863b0422bd2f80040dcd8c65361f07c fail

// 0xab8a67d83e838c9936b8aa9990426f421e0ea80a30439fc3f20cfe08b8244e54
reinvest('0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0xbca6ab0d021a06af2e48b481a3686cfff999681611e0e21539ba77b360f16625
buy('0.18', '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0x75e9407293b91d53f9862bdda6f2b7f5202b96abe752895c19d1251bd0896713
buy('0.016', '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0xe0de7632e7cef74776b90f9d0966f2bf6e2a9fac59ed7ff51a2a51f9e179b27a
buy('0.3', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0x18808fc1f1b02e802b608ecea7514023622cd8bf42f97b5aebf2a5e8e7e8de89
reinvest('0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0x4feb247190cc3982af2a9a6b6aea4143f9ac4a4d19aedb44aa63e0aee0c115b3
buy('0.1', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0xacfb8d7c84d69540d2d50909a767aca9fd120bdbcc344477a36f7eb3e569d7a1, approve

// 0x8785bfe2fece1338c52d2de8e1a770422a5ee962dccaac27e1cdec7e4ba0d462
profit('0.7');

// 0xf29c1a6131cbe890149a9dc189833c7b632e40e40355ee9892fa47ad6cae7494
withdraw('0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0xc0b8cf399e9255bec655b3a69b0b8cee2cb906b54f87d71c4aee35a9d7191140
buy('0.06', '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0x2f74a313705f75dcec03ef8c6e5106ebf38a5e0d7b55a8279eba75cf049009f4
withdraw('0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0x769c33b097dc3dd3ae5243ce32433554b9e1e45856e6799d9dee57ab141e6ac9
transfer('1', '0xE974e991668CDEAF98e03A2154363a8f20494909', '0x649A930B2727eAA78D818D57bA3a94E276Ef3542',
         'sp', '0x221133b7dc15f51e5c956b0401bf795b02197b521de5f002ba058bb00197fb5d',
         '0x490dbf5229bda24e4167e1d3714cbb1741a44fc51355bba4b6a35cb6c859691b');

// 0x1fe655c748b63331bf354ef9322a137c32c6fbde45841dfddfd110b6fae65b4b
transfer('23', '0xE974e991668CDEAF98e03A2154363a8f20494909', '0xF979a3F1567eF18A5D77e8F4b6f9899Cf561d486',
        'nm', '0x90bc789cf2b18799a634ea2fc953483353eaffabf78ed28957a1d075fb074a4a',
        '0x7d323a0f162b860ef29e5eb75e22b7b0058271c60c2e940ff0f8ccfa95a23501');

// 0x92fad6b64fb19b6f4ed6b8d06186ee0c984ca9fd8c28cb1185666410521e54fc
reinvest('0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0x2f67cfd714f2523c842fb66689984cb56e27f121e0f03a387d6286ebced16906
profit('0.3');

// 0xc409bd19034351089008b147a35b85238a5315eef9dad89842b4e76c9f8cd6ba
reinvest('0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0xc03726ce97c86b8ee70b6ab436d7816ed0735d066daadc594ccb02565f913484, doubling
price = ethers.utils.parseUnits('4000000000000000', 0);

// 0x0f9250cf14d2c735f6feacfa262b4dc70e552c342fc8f34650cdd6d38bf9fc96
reinvest('0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0xb9f470d6cfff09ac73e08ed2fc5a44d4a71cbf8d8ebfd513131723a1de69ae85
buy('0.004', '0xE974e991668CDEAF98e03A2154363a8f20494909');

// 0xf04a8b1215bedb8493e8dc7a66e7e8b2ae981730e3a48eca46e106d8c4d6155b
withdraw('0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0xe88b7b760d813c2894a955b35e921c29050c7bc20142f50dbc8579e30513a055
buy('0.01', '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0x6ef9fdd710c625e4fbf823c668d5acacea56b13b0c1866e85dafbdf1ebb676f5
buy('0.012', '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0xe868cb4611690bdd767906219958a1e860d22e26503d3fc06e97dd54ad7f5de2
profit('0.7');

// 0xb9b1388ddd07d012d03d897c7442ac49e7c2c16f9c268ccdc3870eb1dc451942
reinvest('0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0x74c6714cd0748b67c00f35cc664a3508e2699d8024f290508bbe0c8348b48d2e
withdraw('0xC5E4045E291EE6a414beb298310fF41b86D53666');

// 0xa1cb2b28d98a3b21b5368fd6152961139bf441899f3a6359c2f057dae9495b39
transfer('28.680376660501092', '0xC5E4045E291EE6a414beb298310fF41b86D53666',
         '0x7961c6AD766F0306C67b3b2660fE74070ba1aBEA');

// 0xc3c34e6704aa6bf65cfcf26004c3316279a9c2f12c4222f7307a5fef84d2d8b3
price = ethers.utils.parseUnits('8000000000000000', 0);

dump();
check();