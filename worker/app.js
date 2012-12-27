var connection = require('amqp').createConnection({
    'url':rabbitUrl()
});

connection.on('ready', function () {
    console.log('connected to RabbitMQ');
    var e = connection.exchange('node-ack-topic', {
        type:'topic'
    });
    createQ(e);
});


function createQ(e) {
    var q = connection.queue('CFWorkerQueue', function () {
        //Bind to exchange w/ bindingKey/channel 'tasks'
        q.bind(e, 'tasks');
        q.on('queueBindOk', function () {
            subscribeToQ(q);
        });
    });
}

function subscribeToQ(q) {
    q.subscribe({
        ack:true
    }, function (task, message, headers, deliveryInfo) {
        doTask(q, task, deliveryInfo.redelivered);
    });
}

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

var batchNameAndCnt = [];

function updateTaskCount(task, redelivered) {
    if (batchNameAndCnt[task.batchName]) {
        batchNameAndCnt[task.batchName] = batchNameAndCnt[task.batchName] + 1;
    } else {
        console.log('\n\n\n------------------------------------------');
        console.log('\nNow processing batch: ' + task.batchName);
        console.log('\n------------------------------------------');

        batchNameAndCnt[task.batchName] = 1;
    }
    if (redelivered) {
        console.log('Got task: ' + task.taskName + ' <--- (redelivered)');
    } else {
        console.log('Got task: ' + task.taskName);
    }
}

function rabbitUrl() {
    if (process.env.VCAP_SERVICES) {
        conf = JSON.parse(process.env.VCAP_SERVICES);
        return conf['rabbitmq-2.4'][0].credentials.url;
    } else {
        return 'amqp://localhost';
    }
}