import web3 from "./web3";
import CampaignFactory from "./build/CampaignFactory.json";

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  "0xB05207Ee559d3E63484E8286254f4C2D88b3d90b"
);

export default instance;
