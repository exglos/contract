# Audit Report

## 1.  Compilation warnings/errors on ./contracts/Exg.sol:

1. Warning: SPDX license identifier not provided in source file. Before publishing, consider adding a comment containing "SPDX-License-Identifier: <SPDX-License>" to each source file. Use "SPDX-License-Identifier: UNLICENSED" for non-open-source code. Please see https://spdx.org for more information.
--> contracts/Exg.sol


## 2. Moderate warnings:

1. `Exg.buy(address)` (contracts/Exg.sol#144-171) performs a multiplication on the result of a division:
        - exg = toAdmin * 1e18 / price (contracts/Exg.sol#149)
        - payout = exg * profitPerExg / 1e18 (contracts/Exg.sol#159)
2. `Exg.reinvest()` (contracts/Exg.sol#189-209) performs a multiplication on the result of a division:
        - exg = divs * 1e18 / price (contracts/Exg.sol#195)
        - payout = divs + exg * profitPerExg / 1e18 (contracts/Exg.sol#197)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#divide-before-multiply

3. `Exg.buy(address)`.toRef (contracts/Exg.sol#151) is a local variable never initialized
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-local-variables

4. `Exg.setAdmin(address)` (contracts/Exg.sol#82-84) should emit an event for: 
        - admin = _admin (contracts/Exg.sol#83) 
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-events-access-control

5. `Exg.setAdmin(address)._admin` (contracts/Exg.sol#82) lacks a zero-check on :
                - admin = _admin (contracts/Exg.sol#83)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-zero-address-validation

Pragma version0.8.11 (contracts/Exg.sol#1) allows old versions
solc-0.8.11 is not recommended for deployment
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity

## 3. informationational Warnings

1. Parameter `Exg.setAdmin(address)._admin` (contracts/Exg.sol#82) is not in mixedCase
2. Parameter `Exg.setPrice(uint256)._price` (contracts/Exg.sol#86) is not in mixedCase
3. Parameter `Exg.setRef(uint256,uint256)._refPromille` (contracts/Exg.sol#93) is not in mixedCase
4. Parameter `Exg.setRef(uint256,uint256)._refRequirement` (contracts/Exg.sol#94) is not in mixedCase
Parameter `Exg.setName(string)._name` (contracts/Exg.sol#107) is not in mixedCase
5. Parameter `Exg.setUrl(string)._url` (contracts/Exg.sol#111) is not in mixedCase
6. Parameter `Exg.dividendsOf(address)._holder` (contracts/Exg.sol#116) is not in mixedCase
7. Parameter `Exg.buy(address)._ref` (contracts/Exg.sol#144) is not in mixedCase
8. Parameter `Exg.send(address,address,uint256)._from` (contracts/Exg.sol#211) is not in mixedCase
8. Parameter `Exg.send(address,address,uint256)._to` (contracts/Exg.sol#211) is not in mixedCase
9. Parameter `Exg.send(address,address,uint256)._exg` (contracts/Exg.sol#211) is not in mixedCase
10. Parameter `Exg.transfer(address,uint256)._to` (contracts/Exg.sol#227) is not in mixedCase
11. Parameter `Exg.transfer(address,uint256)._exg` (contracts/Exg.sol#227) is not in mixedCase
12. Parameter `Exg.transferFrom(address,address,uint256)._from` (contracts/Exg.sol#233) is not in mixedCase
13. Parameter `Exg.transferFrom(address,address,uint256)._to` (contracts/Exg.sol#234) is not in mixedCase
14. Parameter `Exg.transferFrom(address,address,uint256)._exg` (contracts/Exg.sol#235) is not in mixedCase
15. Parameter `Exg.approve(address,uint256)._spender` (contracts/Exg.sol#243) is not in mixedCase
16. Parameter `Exg.approve(address,uint256)._exg` (contracts/Exg.sol#243) is not in mixedCase

Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions