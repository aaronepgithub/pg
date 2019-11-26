var app = new Framework7({
    root: '#app',
    name: 'app',
    id: 'app',
    touch: {
        fastClicks: true,
        tapHold: true //enable tap hold events
      },
    material: true,
    cache: true,
    init: true,
    initOnDeviceReady: true,
    on: {
        init: function () {
            console.log('App initialized');
            startup();
        },
    }
});

var $$ = Dom7;


//START TOCK
var timer = new Tock({
    countdown: true,
    interval: 1000,
    callback: tockCallback,
    complete: tockComplete
});

var secondsPerRound = 60;
var roundsComplete = 0;
function tockCallback() {
    //console.log('tockCallback');
    var countdownTime = timer.lap();  //elapsed in milli, per round
    //var secondsInRound = secondsPerRound * 10000 - countdownTime; //round up to show
    console.log('1a. tockCallback, countdownTime: ' + countdownTime + ', Rounded:  ' + Math.round(countdownTime/1000));
    console.log('1b. tockCallback, roundCountdownTime: ' + timer.msToTimecode(countdownTime));

    var elapsedTime = _.now() - startTime;
    console.log('2. tockCallback, elapsedTime: ' + elapsedTime);
    console.log('3. tockCallback, elapsedTime: ' + timer.msToTimecode(elapsedTime) + "\n");

    $$('.total-time').text(timer.msToTimecode(elapsedTime));
    $$('.system-status').text("Running");
}

function tockComplete() {
    roundsComplete += 1;
    console.log('4. tockComplete, roundsComplete: ' + roundsComplete);
    timer.start( (secondsPerRound - 1) * 1000 );
}


var scannedDevices = [];
var scannedDevicesHeartrate = [];
var scannedDevicesSpeed = [];

function postScan(v) {
    //v ==1 is hr, v ==2 is speed
    if (v == 2) {
        console.log('is Speed, send to PostScanSpeed');
        postScanSpeed(v);
        return;
    }
    console.log('starting postScan');
    // console.log("1:  " + JSON.stringify(scannedDevices));    
    scannedDevices = _.uniqBy(scannedDevices, 'name');
    scannedDevicesHeartrate = _.uniqBy(scannedDevicesHeartrate, 'name');
    console.log("scannedDevices:  " + JSON.stringify(scannedDevicesHeartrate));

    // $$('.device-ul').empty();
    scannedDevicesHeartrate.forEach(element => {
        console.log('postScan forEach Element:  ' + JSON.stringify(element));
        // $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-char">'+element.id+'</div> <span class="device-name">'+element.name+'</span><div class="item-footer device-status-footer">device-status-footer</div></div> <div class="item-after device-status">device-status-connect</div> </div> </a> </li>');
        $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-service"></div> <span class="device-name">'+element.name+'</span><div class="item-footer device-id">'+element.id+'</div></div> <div class="item-after device-value"></div>CONNECT</div> </a> </li>');
    });
    console.log('postScan Complete');
    $$('.status-alerts').text('Updated');
}

function postScanSpeed(v) {
    
    console.log('(Speed) starting postScan');
    // console.log("1:  " + JSON.stringify(scannedDevices));    
    scannedDevices = _.uniqBy(scannedDevices, 'name');
    scannedDevicesSpeed = _.uniqBy(scannedDevicesSpeed, 'name');
    console.log("scannedDevices:  " + JSON.stringify(scannedDevicesSpeed));

    //$$('.device-ul').empty();
    scannedDevicesSpeed.forEach(element => {
        console.log('(Speed) postScan forEach Element:  ' + JSON.stringify(element));
        // $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-char">'+element.id+'</div> <span class="device-name">'+element.name+'</span><div class="item-footer device-status-footer">device-status-footer</div></div> <div class="item-after device-status">device-status-connect</div> </div> </a> </li>');
        $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-service"></div> <span class="device-name">'+element.name+'</span><div class="item-footer device-id">'+element.id+'</div></div> <div class="item-after device-value"></div>CONNECT</div> </a> </li>');
    });
    console.log('(Speed) postScan Complete');
    $$('.status-alerts').text('Updated');
}


var startTime;
function startup() {
    console.log('startup function');
    var totalTime = '00:00:00';
    var systemStatus = "Stopped";
    $$('.total-time').text(totalTime);
    $$('.system-status').text(systemStatus);
}

$$('.start-system').on('click', function (e) {
    console.log('click start-system');
        //MOVE TO START BUTTON
        startTime = _.now();
        timer.start(secondsPerRound * 1000);
});


$$('.start-bluetooth-scan').on('click', function (e) {
    console.log('click ble link');
    startBluetoothScan();
});

$$('.device-ul').on('click', 'li', function (e) {
    console.log('clicked a ble device');
    var clickedDeviceIndex = $$(this).index();
    console.log(clickedDeviceIndex);
    startBluetoothConnection(clickedDeviceIndex);
});


$$('.device-ul').on('taphold', 'li', function (e) {
    console.log('clicked a ble device, longclick');
    var clickedDeviceIndex = $$(this).index();
    console.log(clickedDeviceIndex);
    // startBluetoothDisconnection(clickedDeviceIndex);
});

function startBluetoothDisconnection(i) {
    var deviceClicked = scannedDevices[i];
    console.log('startBluetoothDisconnection:  ' + scannedDevices[i].name);
    //TODO:  CHECK FOR SERVICES/CHAR
    ble.stopNotification(deviceClicked.id, "180d", "2a37", function(s) {
        console.log('stop notify success, calling disconnect');
        ble.disconnect(deviceClicked.id, function() {console.log('disconnect success');}, function() {console.log('disconnect failed');} );
    }, function(e) {
        console.log('stop notify failure');
    });

}

var connectedDevices = [];  //Peripheral Object

function startBluetoothConnection(i) {
    console.log('startBluetoothConnection: ' + i);
    var deviceClicked = scannedDevices[i];
    console.log(deviceClicked.id);
    connectedDevices.push(deviceClicked);
    var iD = String(deviceClicked.id);
    ble.connect(iD, function(p) {
        console.log('connected callback:  ' + JSON.stringify(p));
        connectedDevices.push(deviceClicked);
        //TODO CHECK/START ONLY SERVICES/CHAR
        //CHECK TO SEE IF HR VS CSC
        ble.startNotification(p.id, "180d", "2a37", function(b) {
            var data = new Uint8Array(b);
            console.log('notify success HR: ' + data[1] );
            //TODO:  UPDATE UI VALUE, UPDATE UI CHIP
            updateHeartrateChip(p.name, 1, data[1]);
        }, function(e) {
            console.log('notify failure HR:  ' + e);
            setNotificationForSpd(i);
        });
    }, function(p) {
        console.log('disconnected callback:  ' + JSON.stringify(p));
    });

    function setNotificationForSpd(i) {
        var deviceClicked = scannedDevices[i];
        console.log('setNotificationForSpd: ' + deviceClicked.name);
        ble.startNotification(deviceClicked.id, "1816", "2A5B", function(b) {
            var data = new Uint8Array(b);
            console.log('notify success, Speed/Cad: ' + JSON.stringify(data) );
            //TODO:  UPDATE UI VALUE, UPDATE UI CHIP
            updateHeartrateChip(p.name, 2, data[1]);
        }, function(e) {
            console.log('notify failure Speed/Cad:  ' + e);
        });
    }
}

function updateHeartrateChip(n, i, d) {
    console.log('updateHeartrateChip:  ' + i + ', ' + d);

    if (n ==2) {
        $$('.chip-hr').empty();
        $$('.chip-hr').html('<div class="chip-media bg-color-green"><i class="fa fa-heartbeat fa-lg"></i></div><div class="chip-label">Heartrate</div>');
    }
    if (n ==2) {
        $$('.chip-csc').empty();
        $$('.chip-csc').html('<div class="chip-media bg-color-green"><i class="fa fa-bluetooth-b fa-lg"></i></div><div class="chip-label">Speed/Cadence</div>');
    }

}

function updateHeartrateUI() {
    console.log('updateHeartrateUI');
    //TODO:  FIND AND ADD DATA
}



var bleServices = {
	serviceHR: '180d',
	measurementHR: '2a37',
	serviceCSC: '1816',
	measurementCSC: '2A5B',
	servicePOW: '1818',
	measurementPOW: '2A63',
	serviceHRwrist: '55FF'
};



function startBluetoothScan() {
    $$('.device-ul').empty();
    $$('.status-alerts').html('Scanning...');
    ble.scan(['180d'], 2, function (device) {
        console.log(JSON.stringify(device));
        if (device.name) {
            scannedDevices.push(device);
            scannedDevicesHeartrate.push(device);
            $$('.status-alerts').text('Found: ' + device.name);
        }
    }, function (e) {
        console.log('failure, ' + e);
    });

    setTimeout(function () {
        console.log('scan complete, calling postScan');
        scannedDevices = _.uniqBy(scannedDevices, 'name');
        scannedDevicesHeartrate = _.uniqBy(scannedDevicesHeartrate, 'name');
        postScan(1);  //TODO, CONNECT AND FIND SERVICES BEFORE DISPLAY
        startBluetoothScanSpeed();
    },
        3000
    );
}

function startBluetoothScanSpeed() {
    $$('.status-alerts').html('Scanning for Speed...');
    ble.scan(['1816'], 2, function (device) {
        console.log(JSON.stringify(device));
        if (device.name) {
            scannedDevicesSpeed.push(device);
            scannedDevices.push(device);
            $$('.status-alerts').text('Found: ' + device.name);
        }
    }, function (e) {
        console.log('failure, ' + e);
    });

    setTimeout(function () {
        console.log('Speed scan complete, calling postScan');
        scannedDevicesSpeed = _.uniqBy(scannedDevicesSpeed, 'name');
        scannedDevices = _.uniqBy(scannedDevices, 'name');
        postScan(2);  //TODO, CONNECT AND FIND SERVICES BEFORE DISPLAY
    },
        3000
    );
}


