'use strict';

const utils = require('web3-utils');
const abi = require('web3-eth-abi');
const ethUtils = require('ethereumjs-utils');
const MerkleTree = require('merkle_tree');

class SpearAPI {
    // new class instance requires websocket instance passed
    constructor(websocket, options) {

        this.abi = abi;
        this.toAscii = (input) => utils.toAscii(input);
        this.toHex = (input) => utils.toHex(input);
        this.toBigNumber = (input) => utils.toBigNumber(input);
        this.toDecimal = (input) => utils.toDecimal(input);
        this.toWei = (eth, decimals) => this.toBigNumber(String(eth)).times(this.toBigNumber(10 ** decimals)).floor();
        this.toEth = (wei, decimals) => this.toBigNumber(String(wei)).div(this.toBigNumber(10 ** decimals));
        this.hex2num = (hex) => this.toBigNumber(String(hex)).toString();
        this.isAddress = address => utils.isAddress(address);
        this.toChecksumAddress = address => utils.toChecksumAddress(address);

        this.client = websocket;
        this.userWallet = '0x';
        this.ctrAddrBook = {};

        this.ipfs_pubsub_topicList = [];
        this.ipfs_pubsub_handlers = {};

        // encode if packet is object, decode if it is RLPx
        this.handleRLPx = (fields) => (packet) => 
        {
            let m = {};
            try {
                ethUtils.defineProperties(m, fields, packet);
                return m;
            } catch (err) {
                console.trace(err);
                return {};
            }
        }

        this.subscribe = (topic) => (handler = null) => 
        {
            if (handler === null) handler = (stats) => { console.dir(stats); };

            return this.client.subscribe(topic)
                .then((rc) => {
                    if (rc === true) return this.client.on(topic, handler);
                })
                .catch((err) => { console.trace(err); return false; })
        }

        this.unsubscribe = (topic) => 
        {
            return this.client.unsubscribe(topic)
                .then((rc) => {
                    return this.client.off(topic);
                })
                .catch((err) => { console.trace(err); return false; })
        }

        this.verifySignature = (sigObj) => //sigObj = {payload, v,r,s, networkID}
        {
            let signer = '0x' +
                ethUtils.bufferToHex(
                    ethUtils.sha3(
                        ethUtils.bufferToHex(
                            ethUtils.ecrecover(sigObj.payload, sigObj.v, sigObj.r, sigObj.s, sigObj.netID)
                        )
                    )
                ).slice(26);

            console.log(`signer address: ${signer}`);

            return signer === ethUtils.bufferToHex(sigObj.originAddress);
        }

        this.makeMerkleTree = (leaves) => {
            let merkleTree = new MerkleTree();
            merkleTree.addLeaves(leaves);
            merkleTree.makeTree();
            return merkleTree;
        }

        this.getMerkleProof = (leaves, targetLeaf) => {
            let merkleTree = new MerkleTree();
            merkleTree.addLeaves(leaves);
            merkleTree.makeTree();

            let __leafBuffer = Buffer.from(targetLeaf.slice(2), 'hex');
            let txIdx = merkleTree.tree.leaves.findIndex((x) => { return Buffer.compare(x, __leafBuffer) == 0 });
            if (txIdx == -1) {
                console.log('Cannot find leave in tree!');
                return false;
            } else {
                console.log(`Found leave in tree! Index: ${txIdx}`);
            }

            let proofArr = merkleTree.getProof(txIdx, true);
            let proof = proofArr[1].map((x) => { return ethUtils.bufferToHex(x); });
            let isLeft = proofArr[0];

            //targetLeaf = ethUtils.bufferToHex(merkleTree.getLeaf(txIdx));
            let merkleRoot = ethUtils.bufferToHex(merkleTree.getMerkleRoot());
            return [proof, isLeft, merkleRoot];
        }

        this.allAccounts = () => {

        }
    }
}

module.exports = SpearAPI;