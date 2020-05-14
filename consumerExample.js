const kafka = require('kafka-node');
const config = require('./config');

var isFirstMessage = true
var initialTimestamp
var nrConsumedMessages = 0
var maxMemory = 0

try {
  const client = new kafka.KafkaClient({ kafkaHost: config.kafkaServer });
  const consumer = new kafka.Consumer(
    client,
    [{ topic: config.kafkaTopic }],
    {
      groupId: 'somegroupid', //consumer group id
      autoCommit: false, // commit offsets automatically periodically
      autoCommitIntervalMs: 200, // auto commit offsets every half a second
      fetchMaxBytes: 1024 * 512, //0.5MB per fetch
      encoding: 'utf8',
    }
  );

  consumer.on('message', (message) => {
    if(message.value){
      const parsedEvent = JSON.parse(message.value)
      if(isFirstMessage){
        console.log(parsedEvent)
        initialTimestamp = Date.now()
        isFirstMessage = false
        setInterval(() => printBenchmark(), 500)
      }
      nrConsumedMessages = nrConsumedMessages + 1
    }
  })

  consumer.on('error', function(err) {
    console.log('error', err);
  });
}
catch(e) {
  console.log(e);
}

const printBenchmark = () => {
  let currMemoryUsage = process.memoryUsage().heapUsed / (1024 * 1024)
  if( currMemoryUsage > maxMemory){
      maxMemory = currMemoryUsage
  }
  console.info(
    'Execution time(s): %ds | Average time per message (ms): %dms | Number Consumed Messages: %d | Current Memory Usage: %d MB | Max Mem Usage: %d MB', 
    (Date.now()-initialTimestamp)/1000, 
    (Date.now()-initialTimestamp)/nrConsumedMessages, 
    nrConsumedMessages, 
    currMemoryUsage,
    maxMemory
  )
}