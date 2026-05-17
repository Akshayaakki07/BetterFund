import web3 from "./web3";
import CampaignFactory from "./build/CampaignFactory.json";

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  "0xDA107F1f04ec1e14127a7f59f2Cc850c3A71A4CC"
);

export default instance;
