module.exports = {
  apps : [{
    name   : "Party Game Server",
    script : "yarn",
    args: "start",
    env: {
      "NODE_ENV": "production",
      "port": 4000
    }
  }]
}
