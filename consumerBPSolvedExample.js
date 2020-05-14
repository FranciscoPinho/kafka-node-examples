const kafka = require('kafka-node');
const config = require('./config');
const axios = require('axios');
const async = require('async')

//BENCHMARK STUFF
var isFirstMessage = true
var initialTimestamp
var nrConsumedMessages = 0
var maxMemory = 0

//ASYNC QUEUE VARS
var paused
const MAX_CONCURRENCY = 30
const PAUSE_CONSUMPTION_THRESHOLD = 2000

try {
  const client = new kafka.KafkaClient({ kafkaHost: config.kafkaServer });
  var consumer = new kafka.Consumer(
    client,
    [{ topic: config.kafkaTopic }],
    {
      groupId: 'bpsolved', //c onsumer group id,
      autoCommit: false,
      fetchMaxBytes: 1024 * 512, //0.5MB per fetch
      encoding: 'utf8',
    }
  );
  
  var consumerQueue = async.queue((payload, done) => {
    setImmediate(async () => {
      nrConsumedMessages = nrConsumedMessages + 1
      await expensiveComputation(payload)
      done()
    })
  }, MAX_CONCURRENCY);

  // FUNCTION TO CALL WHEN CONSUMER QUEUE FINISHES ALL OUTSTANDING TASKS
  consumerQueue.drain(() => {
    resumeConsumer()
    //IF MAX_CONCURRENCY > 1, OFFSETS NEED TO BE COMMITTED MANUALLY HERE AS OPPOSED TO AUTO COMMIT BECAUSE THERE IS NO GUARANTEE OF ORDER OF EXECUTION
    /*consumer.commit((err, data) => {
      resumeConsumer()
    });*/
  })

  consumer.on('message', (message) => {
    if(message.value){
      const parsedEvent = JSON.parse(message.value)
      consumerQueue.push(parsedEvent);
    }
    if(isFirstMessage){
      initialTimestamp = Date.now()
      isFirstMessage = false
      setInterval(() => printBenchmark(), 500)
    }
    if (consumerQueue.length() >= PAUSE_CONSUMPTION_THRESHOLD && !paused) {
      consumer.pause()
      paused = true;
    }
  })

  consumer.on('error', function(err) {
    console.log('error', err)
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
    'Execution time(s): %ds | Average time per message (ms): %dms | Number Consumed Messages: %d | Queued events: %d | Max Mem Usage: %d MB', 
    (Date.now()-initialTimestamp)/1000, 
    (Date.now()-initialTimestamp)/nrConsumedMessages, 
    nrConsumedMessages, 
    consumerQueue.length(),
    maxMemory
  )
}

const resumeConsumer = () => {
  consumer.resume()
  paused = false;
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

