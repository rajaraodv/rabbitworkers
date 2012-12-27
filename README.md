
<h1>A Node.js app that shows the power for RabbitMQ's Work-queue</h1>

There are two apps in this project. A producer and a consumer/worker app. This project shows you how RabbitMQ <b>smartly</b> schedules tasks sent by a producer to various (Node.js) workers. This project also shows <b>'ack'</b> (acknowledgement) feature.

Specifically it shows:
<ul>
<li>RabbitMQ schedules tasks in round-robin fashion among workers
<li> W/ ACK, If one of the worker takes long time (long job or is hanging), RabbitMQ spreads the work to other AVAILABLE workers.
<li>W/ ACK, If one of the worker dies <i>while processing</i> a job, RabbitMQ  <b>reschedules</b> the job.
</li>
<li>Most importantly, how you can implement all these w/ just few lines of code!
</li>
</ul>

<h4>How to get the application running on Cloud Foundry</h4>

<ul>
<li>cd to RabbitWorkers/worker folder </li>
<li> Push the app to cloud foundry as `standalone` (background app) app w/ 4 instances & connect to RabbitMQ service w/ name `rabbit-service1`

</li>
</ul>

```
vmc push rabbitworker
Instances> 4

1: node
2: other
Framework> 2

1: sinatra
2: rack
3: lift
4: grails
5: rails3
6: spring
7: java_web
8: standalone
9: node
10: play
Framework> 8

Startup command> node app.js

1: node
2: node06
3: node08
4: other
Runtime> 3

1: 64M
2: 128M
3: 256M
4: 512M
Memory Limit> 64M

Creating rabbitworker... OK

1: rabbitworker.cloudfoundry.com
2: none
URL> 2


Create services for application?> y

1: blob 0.51
2: mongodb 2.0
3: mysql 5.1
4: postgresql 9.0
5: rabbitmq 2.4
6: redis 2.6
7: redis 2.4
8: redis 2.2
What kind?> 5

Name?> rabbit-service1

Creating service rabbit-service1... OK
Binding rabbit-service1 to rabbitworker... OK
Create another service?> n

Bind other services to application?> n

Save configuration?> n

Uploading rabbitworker... OK
Starting rabbitworker... OK
Checking rabbitworker... OK

```

<ul>
<li>cd to RabbitWorkers/procducer folder </li>
<li> Push the app to cloud foundry as `standalone` (background app) app w/ RabbitMQ service `rabbit-service1`

</li>
</ul>

```
> vmc push rabbitproducer
Instances> 1

1: node
2: other
Framework> 2

1: node
2: lift
3: rails3
4: sinatra
5: play
6: java_web
7: grails
8: standalone
9: rack
10: spring
Framework> 8

Startup command> node app.js

1: node
2: node06
3: node08
4: other
Runtime> 3

1: 64M
2: 128M
3: 256M
4: 512M
Memory Limit> 64M

Creating rabbitproducer... OK

1: rabbitproducer.cloudfoundry.com
2: none
URL> 2


Create services for application?> n

Bind other services to application?> y

1: rabbit-service1
2: mongodb-foobar
Which service?> 1

Binding rabbit-service1 to rabbitproducer... OK
Bind another service?> n

Save configuration?> n

Uploading rabbitproducer... OK
Starting rabbitproducer... OK
Checking rabbitproducer... OK
```

<ul>
<li>
Wait for 10 second for the job to be processed. Then check logs:

</li>
</ul>
```

> vmc logs rabbitworker --all
Getting logs for rabbitworker #0... OK

Reading logs/stderr.log... OK


Reading logs/stdout.log... OK
connected to RabbitMQ
Got task: Task# 1



------------------------------------------

Now processing batch: impartial-lunchroom

------------------------------------------
Total tasks processed: 1
Got task: Task# 5
Total tasks processed: 2
Got task: Task# 10
Total tasks processed: 3
Got task: Task# 11
Total tasks processed: 4
Got task: Task# 13
Total tasks processed: 5
Got task: Task# 18
Total tasks processed: 6
Got task: Task# 20
Total tasks processed: 7



Getting logs for rabbitworker #1... OK

Reading logs/stderr.log... OK


Reading logs/stdout.log... OK
connected to RabbitMQ
Got task: Task# 2



------------------------------------------

Now processing batch: impartial-lunchroom

------------------------------------------
Total tasks processed: 1
Got task: Task# 7
Total tasks processed: 2
Got task: Task# 8
Total tasks processed: 3
Got task: Task# 12
Total tasks processed: 4
Got task: Task# 15
Total tasks processed: 5
Got task: Task# 16
Total tasks processed: 6
Got task: Task# 19
Total tasks processed: 7



Getting logs for rabbitworker #2... OK

Reading logs/stderr.log... OK


Reading logs/stdout.log... OK
connected to RabbitMQ
Got task: Task# 3



------------------------------------------

Now processing batch: impartial-lunchroom

------------------------------------------



Getting logs for rabbitworker #3... OK

Reading logs/stderr.log... OK


Reading logs/stdout.log... OK
connected to RabbitMQ
Got task: Task# 4



------------------------------------------

Now processing batch: impartial-lunchroom

------------------------------------------
Total tasks processed: 1
Got task: Task# 6
Total tasks processed: 2
Got task: Task# 9
Total tasks processed: 3
Got task: Task# 3 <--- (redelivered)
Total tasks processed: 4
Got task: Task# 14
Total tasks processed: 5
Got task: Task# 17
Total tasks processed: 6



```


<h4> Play around w/ the below function to simulate long jobs and worker-crashes</h4>

```javascript

function doTask(q, task, redelivered) {
    //default time for task 1 second
    var taskTime = 1000;

    //Comment the below section to make all jobs take 1 second.

    //Task #4 takes 5 seconds (instead of typical 1 sec)
    if (task.taskName === 'Task# 4') {
        taskTime = 5000;
    }


    updateTaskCount(task, redelivered);


     // Comment the below section to spread job evenly

     //Crash the worker if it gets task #3
     // and a not-redelivered(otherwise, we will crash all instance when are redelivered by RabbitMQ)
     if (task.taskName === 'Task# 3' && !redelivered) {
        q.close();
        return;
     }


    //Each task takes 1 second to process
    setTimeout(function () {
        console.log('Total tasks processed: ' + batchNameAndCnt[task.batchName]);
        q.shift(); // MAKE SURE TO DO SHIFT (to send ACK)
    }, taskTime);
}

```

<h4>How to get the application running on Localhost</h4>

<ul>
<li>
Install <a href='http://www.rabbitmq.com/download.html' target='_blank'>RabbitMQ</a>
</li>
<li>
Simply open at least 2 terminal windows for worker and 1 more for producer.
</li>
<li>
cd to rabbitworker/worker in worker terminals and run `node app.js`. And keep them running.
</li>
<li>
cd to rabbitworker/producer and then push the job.
</li>
</ul>




