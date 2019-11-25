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
function postScan() {
    console.log('starting postScan');
    // console.log("1:  " + JSON.stringify(scannedDevices));    
    scannedDevices = _.uniqBy(scannedDevices, 'name');
    console.log("scannedDevices:  " + JSON.stringify(scannedDevices));

    $$('.device-ul').empty();
    scannedDevices.forEach(element => {
        console.log('postScan forEach Element:  ' + JSON.stringify(element));
        $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-char">'+element.id+'</div> <span class="device-name">'+element.name+'</span><div class="item-footer device-status-footer">device-status-footer</div></div> <div class="item-after device-status">device-status-connect</div> </div> </a> </li>');
    });
    console.log('postScan Complete');
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
        ble.startNotification(iD, "180d", "2a37", function(b) {
            var data = new Uint8Array(b);
            console.log('success: ' + data[1] );
            //TODO:  UPDATE UI VALUE, UPDATE UI CHIP
            updateHeartrateChip();
        }, function(e) {
            console.log('failure:  ' + e);
        });
    }, function(p) {
        console.log('disconnected callback:  ' + JSON.stringify(p));
    });
}

function updateHeartrateChip() {
    console.log('updateHeartrateChip');
    $$('.chip-hr').empty();
    $$('.chip-hr').html('<div class="chip-media bg-color-green"><i class="fa fa-heartbeat fa-lg"></i></div><div class="chip-label">Heartrate</div>');
}

function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
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

    $$('.status-alerts').html('Scanning...');
    ble.scan(['180d'], function (device) {
        console.log(JSON.stringify(device));
        if (device.name) {
            scannedDevices.push(device);
        }
    }, function (e) {
        console.log('failure, ' + e);
    });

    setTimeout(function () {
        console.log('scan complete, calling postScan');
        scannedDevices = _.uniqBy(scannedDevices, 'name');
        postScan();
    },
        2500
    );
}


