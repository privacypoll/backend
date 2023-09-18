export default {
  async fetch(request, env, ctx) {
    const resHeaders = new Headers();
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Headers", "*");

    if (request.method === "OPTIONS") {
      return new Response("", {headers: resHeaders});
    }

    const voteId = await request.headers.get("Vote-Id");

    try {
      const voteBlockReq = await env.DB_BLOCKCHAINS.prepare("SELECT * FROM vote" + voteId + " ORDER BY BlockId DESC LIMIT 1").run();
      const voteBlock = voteBlockReq.results[0];
      const voteBlockRes = {
        blockId: voteBlock.blockId,
        blockProof: voteBlock.public2
      };

      return new Response(JSON.stringify(voteBlockRes), {headers: resHeaders});
    } catch (e) {
      if (e.message.startsWith("D1_ERROR: no such table")) {
        return new Response("", {status: 404, headers: resHeaders});
      } else {
        throw e;
      }
    }
  },
};
