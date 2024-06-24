// Source: https://github.com/permaweb/ao-bazar/blob/91cd9975cf8d2dfae4ac068f678672f705ab966c/src/helpers/config.ts

export const profileAOS = {
  module: "sBmq5pehE1_Ed5YBs4DGV4FMftoKwo_cVVsCpPND36Q",
  scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
  // ucm: 'U3TjJAZWJjlWBB4KAXSHKzuky81jtyh0zqH8rUL4Wd0',
  // defaultToken: 'xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10',
  // pixl: 'DM3FoZUq_yebASPhgd8pEIRIzDW6muXEhxz5-JwbZwo',
  // collectionsRegistry: 'TFWDmf8a3_nw43GCm_CuYlYoylHAjCcFGbgHfDaGcsg',
  profileRegistry: "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY",
  profileSrc: "pbrl1fkS3_SZP3RqqPIjbt3-f81L9vIpV2_OnUmxqGQ",
  getTags: () => [
    { name: "Date-Created", value: new Date().getTime().toString() },
    { name: "Action", value: "CreateProfile" },
  ],
};
