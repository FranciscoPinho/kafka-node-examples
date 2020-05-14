const kafka = require('kafka-node');
const axios = require('axios');
const config = require('./config');

const MAX_MEMORY = 200  //LETS CAP MEMORY USAGE TO 200MB
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
      groupId: 'bpressured', //c onsumer group id
      autoCommit: false, // commit offsets automatically periodically
      autoCommitIntervalMs: 5000, // auto commit offsets every half a second
      fetchMaxBytes: 1024 * 512, //0.5MB per fetch
      encoding: 'utf8',
    }
  );

  consumer.on('message', async (message) => {
    if(message.value){
      const parsedEvent = JSON.parse(message.value)
      nrConsumedMessages = nrConsumedMessages + 1
      if(isFirstMessage){
        initialTimestamp = Date.now()
        setInterval(() => printBenchmark(), 500)
        isFirstMessage = false
      }
      await expensiveComputation(parsedEvent)
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
  if(currMemoryUsage > MAX_MEMORY){
    console.log("ran out of memory")
    process.exit(1)
  }
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

const expensiveComputation = async (parsedEvent) => {
  try { 
    if (parsedEvent) {
      await axios.get('http://www.mocky.io/v2/5ebc25942e000060009f4247')
    }
  }
  catch(err){
  }
}