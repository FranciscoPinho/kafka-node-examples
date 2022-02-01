# kafka-node-examples

This repository contains example code for solving Kafka consumer back pressure issues. This is essentially the scenario where a particular topic contains a big number of unprocessed messages (events). Additionally the processing of the message is slower than the rate at which the consumer is pulling messages from the Kafka cluster, this creates a situation in which a deployed consumer service could run into out of memory issues by being overwhelmed with more messages than it can process on time. In this example the processing of the message would require communication with some kind of external server (http request) which is the ideal use case for a Node service which excels in I/O intensive programs.

This code ran against a simple containerized kafka deploymente which can be found here: https://github.com/wurstmeister/kafka-docker

- We have a simple example producer program (producerExample.js) that concurrently sends 10k messages into the designated Kafka Topic.

We also contain three distinct versions of the consumer program to simulate the different circumstances, how we can run into this problem and what can we do to fix it
- We have a simple example consumer program (consumerExample.js) that manages to process the entire load of messages since the processing is instantaneous (does not contain the http request, it simply receives and prints a periodic benchmark of how many messages were processed every half a second)

- We have a simulated back pressure problem consumer program in (consumerBackPressureExample.js) where we set a memory limit and if we go over this memory limit, we terminate the program (this to simulate the failure of a Kubernetes pod for example). The 10k messages from the producer with the requirement of making an async HTTP request to an external API would quickly exceed the program's memory limit as we would be triggering as many HTTP requests as possible due to their async nature

- The final program contains the solution to the back pressure issue (consumerBPSolvedExample.js) where with a queue strategy we set a particular threshold/cap of events/messages that we allow into the consumer before pausing the fetching of more messages from the Kafka partition. Thus we prevent the program from ballooning out of memory. In this example we also print the benchmark and the memory consumption was always within a maximum ceiling thus solving our back pressure issue. In a real world scenario we would have to take into account other factors such as the average size of each message/event, the nature of the processing that we have to do which would call for a different tech toolset for the consumer program (golang for example for CPU intensive processing of events)
