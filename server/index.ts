// @ts-ignore
import express, { Request, Response, NextFunction } from 'express';
const { ethers } = require("hardhat");

const app = express();
const cors = require('cors')
// Request body를 parsing 하기 위한 미들웨어 사용
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const totalMintedContract: {
    id: number; governanceToken: { hash: any; contractAddress: any; };
    airdropContract: { hash: any; contractAddress: any; };
}[] = [];

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    // 서버가 minting한 주소 전체를 가지고 있도록 한다
    res.send('Crypto is eating the world!');
});

app.get('/mint/getAll', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).send({
       data: totalMintedContract
   })
});

app.post('/mint', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const Token = await ethers.getContractFactory("TelescopeToken");
        const name: string = req.body['name'];
        const ticker: string = req.body['ticker'];
        const DAOName: string = req.body['DAOName'];
        const intro: string = req.body['intro'];
        const image: string = req.body['image'];
        const link: string = req.body['link'];
        const initial_supply: string = req.body['initial_supply'];
        const owner: string = req.body['owner'];
        const airdrop_timestamps: number[] = req.body['airdrop_timestamps'];
        const airdrop_target_addresses: string[] = req.body['airdrop_target_addresses'];
        const airdrop_round_airdrop_amounts: number = req.body['airdrop_round_airdrop_amounts'];

        const hardhatToken = await Token.deploy(name, ticker, DAOName, intro, image, link, initial_supply, owner);
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
        const receipt = await hardhatToken.deployed();

        console.log("airdrop_timestamps", airdrop_timestamps)
        console.log("airdrop_target_addresses", airdrop_target_addresses)

        const Airdrop = await ethers.getContractFactory("ScheduledAirDrop");
        const airdropToken = await Airdrop.deploy(
            hardhatToken.address,
            airdrop_timestamps,
            airdrop_timestamps.length,
            airdrop_target_addresses,
            airdrop_round_airdrop_amounts
        )

        const receiptAirdrop = await airdropToken.deployed();

        totalMintedContract.push(
            {
                "id": totalMintedContract.length + 1,
                "governanceToken": {
                    hash: receipt.deployTransaction.hash,
                    contractAddress: receipt.deployTransaction.creates,
                },
                "airdropContract": {
                    hash: receiptAirdrop.deployTransaction.hash,
                    contractAddress: receiptAirdrop.deployTransaction.creates,
                }
            }
        )

        return res.status(200).send({
            "governanceToken": {
                hash: receipt.deployTransaction.hash,
                contractAddress: receipt.deployTransaction.creates,
            },
            "airdropContract": {
                hash: receiptAirdrop.deployTransaction.hash,
                contractAddress: receiptAirdrop.deployTransaction.creates,
            }
        })

    } catch (err) {
        console.log(err);
        return res.status(500).send({
            error: err
        })
    }
});

app.listen('8080', () => {
    console.log(`
  ################################################
  🛡️  Server listening on port: 8080🛡️
  ################################################
`);
});