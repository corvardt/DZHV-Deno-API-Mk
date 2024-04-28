import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
const kv = await Deno.openKv();
const Fetch = async () => {
  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0x3419875B4D3Bca7F3FddA2dB7a476A79fD31B4fE"
    );
    const data = response.body ? await response.json() : {};
    let totalvolume = 0;
    let totalprice = 0;
    let totalliquidity = 0;
    for (let i = 0; i < data.pairs.length; i++) {
      const fixedliq = Number(data.pairs[i].liquidity.usd).toFixed(2);
      const fixedvalue = Number(data.pairs[i].priceUsd).toFixed(5);
      switch (data.pairs[i].url) {
        case "https://dexscreener.com/ethereum/0xb7a71c2e31920019962cb62aeea1dbf502905b81":
          totalvolume += data.pairs[i].volume.h24;
          totalprice += Number(fixedvalue);
          totalliquidity += Number(fixedliq);
          break;
        case "https://dexscreener.com/arbitrum/0x05c5bdbc7b3c64109ddcce058ce99f4515fe1c83":
          totalvolume += data.pairs[i].volume.h24;
          totalprice += Number(fixedvalue);
          totalliquidity += Number(fixedliq);
          break;
        case "https://dexscreener.com/bsc/0x642089a5da2512db761d325a868882ece6e387f5":
          totalvolume += data.pairs[i].volume.h24;
          totalprice += Number(fixedvalue);
          totalliquidity += Number(fixedliq);
          break;
        case "https://dexscreener.com/base/0xb64dff20dd5c47e6dbb56ead80d23568006dec1e":
          totalvolume += data.pairs[i].volume.h24;
          totalprice += Number(fixedvalue);
          totalliquidity += Number(fixedliq);
          break;
        case "https://dexscreener.com/avalanche/0x523a04633b6c0c4967824471dda0abbce7c5e643":
          totalvolume += data.pairs[i].volume.h24;
          totalprice += Number(fixedvalue);
          totalliquidity += Number(fixedliq);
          break;
        default:
          break;
      }
    }
    // calc marketcap
    const avrg = totalprice / 5;
    const fixedavrg = avrg.toFixed(5);
    const supply = 946778380;
    // set kvs
    const timestamp = Date.now();
    await kv.set(["weekly-mkcap", timestamp], {
      timestamp: timestamp,
      marketcap: Number(fixedavrg) * supply,
    });
    await kv.set(["weekly-liquidity", timestamp], {
      timestamp: timestamp,
      liq: totalliquidity,
    });
    await kv.set(["weekly-volume", timestamp], {
      timestamp: timestamp,
      volume: totalvolume,
    });
    await kv.set(["weekly-price", timestamp], {
      timestamp: timestamp,
      averageprice: Number(fixedavrg),
    });
    console.log(timestamp, "weekly data: Done");
  } catch (error) {
    const timestamp = Date.now();
    console.log(timestamp, ": error");
    console.error(error);
  }
};
Deno.cron("Run every Monday at midnight", "0 0 * * MON", () => {
  Fetch();
  });
const app = new Application();
const router = new Router();
app.use(oakCors());
const getDataByPrefix = async (ctx, prefix) => {
  const data = [];
  const result = await kv.list({ prefix: [prefix] });
  for await (const { value } of result) {
    data.push(value);
  }
  return (ctx.response.body = data);
};
router.get("/v1/weekly/volume", async (ctx) =>
  getDataByPrefix(ctx, "weekly-volume")
);
router.get("/v1/weekly/marketcap", async (ctx) =>
  getDataByPrefix(ctx, "weekly-mkcap")
);
router.get("/v1/weekly/liq", async (ctx) =>
  getDataByPrefix(ctx, "weekly-liquidity")
);
router.get("/v1/weekly/averageprice", async (ctx) =>
  getDataByPrefix(ctx, "weekly-price")
);
app.use(router.routes());
app.use(router.allowedMethods());
await app.listen({ port: 8001 });
