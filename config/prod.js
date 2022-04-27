module.exports = {
  namespace: '/messenger',
  jwt: {
    secret: process.env.SECRET,
    expiration: '48h'
  },
  origins: ['*'],
}