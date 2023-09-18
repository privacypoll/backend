import { keyToInt } from '@cloudflare/zkp-ecdsa'

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

    const publicKey = await crypto.subtle.importKey("jwk", JSON.parse(atob(bodyJson.publicKey)), {name: "ECDSA", namedCurve: "P-256"}, true, ["verify"]);
    const publicBigInt = await keyToInt(publicKey);

    try {
       await env.DB_KEYRINGS.prepare("INSERT INTO vote" + voteId + " (publicBigInt, identityString) VALUES (?, ?);").bind(publicBigInt.toString(), bodyJson.identityString).run();
       return new Response("", {headers: resHeaders});
    } catch (e) {
      if (e.message.startsWith("D1_ERROR: no such table")) {
        return new Response("", {status: 404, headers: resHeaders});
      } else if (e.message.startsWith("D1_ERROR: UNIQUE constraint failed")) {
        return new Response("", {status: 409, headers: resHeaders});        
      } else {
	throw e;
      }
    }
  }
}
