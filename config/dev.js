module.exports = {
  namespace: '/',
  jwt: {
    secret: process.env.SECRET,
    expiration: '48h'
  },
  origins: ['*'],
}