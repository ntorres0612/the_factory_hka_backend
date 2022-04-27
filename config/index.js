const enviroment = process.env.NODE_ENV || 'development'

const configBase = {
  port: 6002,
}

let configEnviroment = {}

switch (enviroment) {
  case 'desarrollo':
  case 'dev':
  case 'development':
    configEnviroment = require('./dev')
    break
  case 'producción':
  case 'prod':
  case 'production':
    configEnviroment = require('./prod')
    break
  default:
    configEnviroment = require('./dev')
}

module.exports = {
  ...configBase,
  ...configEnviroment
}