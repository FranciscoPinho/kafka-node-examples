const kafka = require('kafka-node')
const config = require('./config')

try {
  let errors = 0
  let sentMessages = 0
  const topic = config.kafkaTopic
  const producer = new kafka.HighLevelProducer(new kafka.KafkaClient({ kafkaHost: config.kafkaServer }))
  producer.on('ready', async () => {
    const promises = []
    for (let i = 0; i < 10000; i++) {
      promises.push(
        new Promise((resolve) =>
          producer.send(
            [
              {
                topic: topic,
                messages: JSON.stringify({
                  email: `user${i}@gmail.com`,
                  username: `testproducer${i}`
                })
              }
            ],
            (err, data) => {
              if (err) {
                errors = errors + 1
              } else sentMessages = sentMessages + 1
              resolve()
            }
          )
        )
      )
    }
    await Promise.all(promises)
    console.log(`Sent messages ${sentMessages}, errors ${errors}`)
    process.exit(1)
  })

  producer.on('error', function (err) {
    console.log(err)
    console.log('[kafka-producer -> ' + topic + ']: connection errored')
    throw err
  })
} catch (e) {
  console.log(e)
}
