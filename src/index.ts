import * as crypto from 'crypto';

class Transaction {

    constructor(
        public amount: number,
        public payer: string, // Public Key
        public payee: string // Public Key
    ) {}

    toString(){
        return JSON.stringify(this);
    }

}

class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public previousHash: string,
        public transaction: Transaction,
        public timeStamp = Date.now()
    ) {}

    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

}

class Chain {

    public static instance = new Chain();

    chain: Block[];

    constructor(){
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock(){
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number){
        let solution = 1;
        console.log('⛏️ mining ...');

        while(true){
            const hash = crypto.createHash('MD5'); // MD5 = fast, SHA512 = slow
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substr(0,4) === '0000'){
                console.log(`Solved: ${solution}`);
                return solution;
            } else {
                solution ++;
            }
        }
    }

    addBlock(
        transaction: Transaction,
        senderPublicKey: string,
        signature: Buffer
    ){
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid){
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }

}

class Wallet {

    public publicKey: string;
    public privateKey: string;

    constructor(){
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        });

        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey
    }

    sendMoney(ammount: number, payeePublicKey: string){
        const transaction = new Transaction(ammount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }

}

const person1 = new Wallet();
const person2 = new Wallet();
const person3 = new Wallet();

person1.sendMoney(50, person2.publicKey);
person2.sendMoney(20, person3.publicKey);
person3.sendMoney(100, person1.publicKey);

console.log(Chain.instance);