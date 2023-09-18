export default {
  async fetch(request, env, ctx) {   
    const voteId = await request.headers.get("Vote-Id");

    const resHeaders = new Headers();
    resHeaders.set("Access-Control-Allow-Origin", "*");

    try {
      const initialBlockReq = await env.DB_BLOCKCHAINS.prepare("SELECT * FROM vote" + voteId + " WHERE BlockId = ?").bind(1).run();
      const initialBlock = initialBlockReq.results[0];
      const initialBlockRes = {
        blockId: initialBlock.blockId,
        voteOptions: initialBlock.voteString,
        publicKey: initialBlock.public1,
        signature: initialBlock.public2
      };

      return new Response(JSON.stringify(initialBlockRes), {headers: resHeaders});
    } catch (e) {
      if (e.message.startsWith("D1_ERROR: no such table")) {
        return new Response("", {status: 404, headers: resHeaders});
      } else {
        throw e;
      }
    }
  },
};
