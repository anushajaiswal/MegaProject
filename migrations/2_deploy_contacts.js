var Contest = artifacts.require("../contracts//Contest.sol");

module.exports = function (deployer) {
  deployer.deploy(Contest);
};
