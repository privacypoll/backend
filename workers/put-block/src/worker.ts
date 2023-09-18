import { generateParamsList, verifySignatureList } from '@cloudflare/zkp-ecdsa'

export default {
  async fetch(request, env, ctx) {
    const resHeaders = new Headers();
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Headers", "*");

    if (request.method === "OPTIONS") {
      return new Response("", {headers: resHeaders});
    }

    const voteId = request.headers.get("Vote-Id");
    const bodyJson = await request.json();

    try {
      const prevBlockReq = await env.DB_BLOCKCHAINS.prepare("SELECT blockId, public2 FROM vote" + voteId + " ORDER BY blockId DESC LIMIT 1;").run();
      const prevBlockReq2 = prevBlockReq.results[0];
      var prevBlock = {
        blockId: prevBlockReq2.blockId,
        blockProof: prevBlock2.public2
      };
    } catch (e) {
      if (e.message.startsWith("D1_ERROR: no such table")) {
        return new Response("", {status: 404, headers: resHeaders});
      } else {
	throw e;
      }
    }

    try {
      const keyringReq = await env.DB_KEYRINGS.prepare("SELECT publicBigInt FROM vote" + voteId + ";").run();
      var keyring = keyringReq.results.map((x) => BigInt(x));
    } catch (e)	{
      if (e.message.startsWith("D1_ERROR: no such table")) {
        return new Response("", {status: 404, headers: resHeaders});
      } else {
        throw e;
      }
    }

    if (!(prevBlock.blockId + 1 === bodyJson.voteBlock.blockId)) {
        return new Response("", {status: 409});
    }

    const bodyver = await verifySignatureList(generateParamsList(), new Uint8Array(await crypto.subtle.digest('SHA-256', JSON.stringify({TODO}))), keyring, bodyJson.proof);
    const votever = await verifySignatureList(generateParamsList(), new Uint8Array(await crypto.subtle.digest('SHA-256', voteId)), keyring, bodyJson.voteBlock.idProof);

    if (!(bodyver && votever)) {    
        return new Response("", {status: 403});
    }

    await env.DB_BLOCKCHAINS.prepare("INSERT INTO vote" + voteId + " (voteString, public1, public2) VALUES (?, ?, ?);").bind(bodyJson.voteBlock.vote, bodyJson.voteBlock.idProof, bodyJson.proof).run()
    return new Response("");
  }
};
