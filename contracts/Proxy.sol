// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

import "./Exg.sol";


interface ExgInterface {
    function balanceOf(address _holder) external view returns (uint256);

    function dividendsOf(address _holder) external view returns (uint256);

    function buy(address payable _ref) external payable;

    function withdraw() external;

    function reinvest() external;

    function transfer(address _to, uint256 _exg) external returns (bool);
}


contract Proxy {
    ExgInterface exg;

    constructor(address _exg) payable {
        exg = ExgInterface(_exg);
    }

    receive() external payable {
    }

    function buy(address payable _ref, uint256 _wei) external {
        exg.buy{value: _wei}(_ref);
    }

    function withdraw() external {
        exg.withdraw();
    }

    function reinvest() external {
        exg.reinvest();
    }

    function transfer(address _to, uint256 _exg) external returns (bool) {
        return exg.transfer(_to, _exg);
    }

    function read() external view returns (
        uint256 _contractWei,
        uint256 _wei,
        uint256 _exg,
        uint256 _divs
    ) {
        return (
            address(exg).balance,
            address(this).balance,
            exg.balanceOf(address(this)),
            exg.dividendsOf(address(this))
        );
    }
}
