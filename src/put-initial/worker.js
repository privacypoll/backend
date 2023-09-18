export default {
  async fetch(request, env, ctx) {   
    function arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    
    const voteId = Math.random().toString(10).substr(2, 6); // Math.floor(Date.now()/1000).toString();
    const bodyJson = await request.json();

    const initialBlock = {
      blockId: 1,
      voteOptions: bodyJson.voteOptions,
      publicKey: env.PUB_JWK
    };

    const key = await crypto.subtle.importKey("jwk", JSON.parse(atob(env.PRI_JWK)), {name: "ECDSA", namedCurve: "P-256"}, true, ["sign"]);
    let enc = new TextEncoder();
    const signature = await crypto.subtle.sign({name: "ECDSA", hash: "SHA-256"}, key, enc.encode(JSON.stringify(initialBlock)));

    await env.DB_BLOCKCHAINS.batch([
      env.DB_BLOCKCHAINS.prepare("CREATE TABLE IF NOT EXISTS vote" + voteId + " (blockId INTEGER PRIMARY KEY, voteString TEXT, public1 TEXT, public2 TEXT);"),
      env.DB_BLOCKCHAINS.prepare("INSERT INTO vote" + voteId + " (voteString, public1, public2) VALUES (?, ?, ?);").bind(JSON.stringify(initialBlock.voteOptions), initialBlock.publicKey, arrayBufferToBase64(signature))
    ]);

    await env.DB_KEYRINGS.prepare("CREATE TABLE IF NOT EXISTS vote" + voteId + " (identityId INTEGER PRIMARY KEY, publicBigInt UNIQUE, identityString UNIQUE);").run();

    const resHeaders = new Headers();
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(JSON.stringify({voteId: voteId}), {headers: resHeaders});
  }
};
