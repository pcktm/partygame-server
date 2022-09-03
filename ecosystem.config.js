module.exports = {
  apps : [{
    name   : "Party Game Server",
    script : "./dist/src/index.js",
    env: {
      "NODE_ENV": "production",
      "port": 4000
    }
  }]
}
