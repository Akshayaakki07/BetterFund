import Head from "next/head";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import { getETHPrice, getWEIPriceInUSD } from "../lib/getETHPrice";
import {
  Heading,
  useColorModeValue,
  Text,
  Button,
  Flex,
  Container,
  SimpleGrid,
  Box,
  Img,
  Icon,
  chakra,
  Tooltip,
  SkeletonCircle,
  HStack,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton
} from "@chakra-ui/react";

import factory from "../smart-contract/factory";
import web3 from "../smart-contract/web3";
import Campaign from "../smart-contract/campaign";
import { FaHandshake } from "react-icons/fa";

export async function getServerSideProps(context) {
  let campaigns = [];
  try {
    campaigns = await factory.methods.getDeployedCampaigns().call();
  } catch (error) {
    console.error("Error fetching campaigns:", error);
  }

  return {
    props: { campaigns },
  };
}

function CampaignCard({
  name,
  description,
  creatorId,
  imageURL,
  id,
  balance,
  target,
  ethPrice,
}) {
  return (
    <NextLink href={`/campaign/${id}`}>
      <Box
        bg={useColorModeValue("white", "gray.800")}
        maxW={{ md: "sm" }}
        borderWidth="1px"
        rounded="lg"
        shadow="lg"
        position="relative"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        transition={"transform 0.3s ease"}
        _hover={{
          transform: "translateY(-8px)",
        }}
      >
        <Box height="18em">
          <Img
            src={imageURL}
            fallbackSrc="/logo.svg"
            alt={`Picture of ${name}`}
            roundedTop="lg"
            objectFit="cover"
            w="full"
            h="full"
            display="block"
          />
        </Box>
        <Box p="6">
          <Flex
            mt="1"
            justifyContent="space-between"
            alignContent="center"
            py={2}
          >
            <Box fontSize="2xl" fontWeight="semibold" as="h4" lineHeight="tight" isTruncated>
              {name}
            </Box>
            <Tooltip
              label="Contribute"
              bg={useColorModeValue("white", "gray.700")}
              placement={"top"}
              color={useColorModeValue("gray.800", "white")}
              fontSize={"1.2em"}
            >
              <chakra.a display={"flex"}>
                <Icon as={FaHandshake} h={7} w={7} alignSelf={"center"} color={"teal.400"} />
              </chakra.a>
            </Tooltip>
          </Flex>
          <Flex alignContent="center" py={2}>
            <Text color={"gray.500"} pr={2}>by</Text>
            <Heading size="base" isTruncated>{creatorId}</Heading>
          </Flex>
          <Flex direction="row" py={2}>
            <Box w="full">
              <Box fontSize={"2xl"} isTruncated maxW={{ base: "15rem", sm: "sm" }} pt="2">
                <Text as="span" fontWeight={"bold"}>
                  {balance > 0 ? web3.utils.fromWei(balance, "ether") : "0"}
                </Text>
                <Text as="span" display={balance > 0 ? "inline" : "none"} pr={2} fontWeight={"bold"}> ETH</Text>
                <Text as="span" fontSize="lg" display={balance > 0 ? "inline" : "none"} fontWeight={"normal"} color={useColorModeValue("gray.500", "gray.200")}>
                  (${getWEIPriceInUSD(ethPrice, balance)})
                </Text>
              </Box>
              <Text fontSize={"md"} fontWeight="normal">
                target of {web3.utils.fromWei(target, "ether")} ETH (${getWEIPriceInUSD(ethPrice, target)})
              </Text>
              <Progress colorScheme="teal" size="sm" value={web3.utils.fromWei(balance, "ether")} max={web3.utils.fromWei(target, "ether")} mt="2" />
            </Box>
          </Flex>
        </Box>
      </Box>
    </NextLink>
  );
}

export default function Dashboard({ campaigns }) {
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [ethPrice, updateEthPrice] = useState(null);
  const [userAccount, setUserAccount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A function to check if wallet is connected and get the account
    const loadAccount = async () => {
      let account = "";
      if (window.ethereum && window.ethereum.selectedAddress) {
        account = window.ethereum.selectedAddress;
      } else {
        // We use window.ethereum.request if available
        try {
          if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) account = accounts[0];
          }
        } catch (e) {
            console.log(e);
        }
      }
      setUserAccount(account);
      return account;
    };

    const fetchCampaignData = async (account) => {
      setLoading(true);
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        const ETHPrice = await getETHPrice();
        updateEthPrice(ETHPrice);

        const myCamps = [];
        const myContribs = [];

        await Promise.all(
          campaigns.map(async (campaignAddress) => {
            const campaignInst = Campaign(campaignAddress);
            const summary = await campaignInst.methods.getSummary().call();
            const manager = summary[4];
            
            // Format object that CampaignCard expects
            const mappedData = {
              name: summary[5],
              description: summary[6],
              creatorId: summary[4],
              imageURL: summary[7],
              id: campaignAddress,
              target: summary[8],
              balance: summary[1],
            };

            // Check if user is manager
            if (manager.toLowerCase() === account.toLowerCase()) {
              myCamps.push(mappedData);
            }

            // Check if user is contributor
            const isContributor = await campaignInst.methods.approvers(account).call();
            if (isContributor) {
              myContribs.push(mappedData);
            }
          })
        );
        
        setMyCampaigns(myCamps);
        setMyContributions(myContribs);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    loadAccount().then((account) => {
      fetchCampaignData(account);
    });

  }, [campaigns]);

  const renderCampaigns = (camps) => {
    if (loading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} py={8}>
          <Skeleton height="25rem" />
          <Skeleton height="25rem" />
          <Skeleton height="25rem" />
        </SimpleGrid>
      );
    }
    if (camps.length === 0) {
      return (
        <Box py={8} textAlign="center">
          <Text fontSize="xl" color="gray.500">No campaigns found.</Text>
        </Box>
      );
    }
    return (
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} py={8}>
        {camps.map((el, i) => (
          <div key={i}>
            <CampaignCard
              name={el.name}
              description={el.description}
              creatorId={el.creatorId}
              imageURL={el.imageURL}
              id={el.id}
              target={el.target}
              balance={el.balance}
              ethPrice={ethPrice}
            />
          </div>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <div>
      <Head>
        <title>Dashboard | BetterFund</title>
        <meta name="description" content="User Dashboard for BetterFund" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <main>
        <Container py={{ base: "4", md: "12" }} maxW={"7xl"}>
          <HStack spacing={2} mb={6}>
            <SkeletonCircle size="4" isLoaded={!loading} />
            <Heading as="h2" size="lg">
              My Dashboard
            </Heading>
          </HStack>

          {!userAccount && !loading ? (
             <Box py={10} textAlign="center">
                <Heading size="md" mb={4}>Please connect your wallet to view your dashboard.</Heading>
                <Text color="gray.500">Use the Connect button in the top right corner.</Text>
             </Box>
          ) : (
            <Tabs variant="enclosed" colorScheme="teal">
              <TabList>
                <Tab>My Campaigns</Tab>
                <Tab>My Contributions</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  {renderCampaigns(myCampaigns)}
                </TabPanel>
                <TabPanel>
                  {renderCampaigns(myContributions)}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}

        </Container>
      </main>
    </div>
  );
}
