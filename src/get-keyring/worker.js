export default {
  async fetch(request, env, ctx) {
    const resHeaders = new Headers();
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Headers", "*");

    if (request.method === "OPTIONS") {
      return new Response("", {headers: resHeaders});
    }

    const voteId = request.headers.get("Vote-Id");

    try {
      const keyringReq = await env.DB_KEYRINGS.prepare("SELECT publicBigInt FROM vote" + voteId + ";").run();
      const keyring = keyringReq.results;
       
      return new Response(JSON.stringify({keyring: keyring}), {headers: resHeaders});
    } catch (e) {
      if (e.message.startsWith("D1_ERROR: no such table")) {
        return new Response("", {status: 404, headers: resHeaders});
      } else {
        throw e;
      }
    }
  }

};
