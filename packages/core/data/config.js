module.exports = {
  proxy: {
    target: "http://ee-release.shimowendang.com",
    ws: true,
    secure: false,
    changeOrigin: true,
    autoRewrite: true,
    cookieDomainRewrite: "",
    headers: {
      Origin: "http://ee-release.shimowendang.com",
      Referer: "http://ee-release.shimowendang.com",
    },
  },
  rules: [
    {
      match: ["GET", "/lizard-api/user/features"],
      callback: async (req, res) => {
        const response = await request('/lizard-api/user/features')
        const data = await response.json()
        if (data && data.data && data.data.features) {
          data.data.features.push('test')
        }
        res.send(data)
      }
    }
  ]
}
