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
    scannedDevices = _.uniqBy(scannedDevices, 'id');
    console.log("scannedDevices:  " + JSON.stringify(scannedDevices));

    $$('.device-ul').empty();
    scannedDevices.forEach(element => {
        console.log('postScan forEach Element:  ' + JSON.stringify(element));
        $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-service"></div> <span class="device-name">'+element.name+'</span><div class="item-footer device-id">'+element.id+'</div></div> <div class="item-after device-value"></div>CONNECT</div> </a> </li>');
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
    console.log('startBluetoothConnection for index: ' + i);
    var deviceClicked = scannedDevices[i];  //TODO, MAYBE PUBLIC VAR?
    console.log('deviceClicked:  ' + deviceClicked.id + ', ' + deviceClicked.name);
    connectedDevices.push(deviceClicked);
    ble.connect(deviceClicked.id, function(p) {
        console.log('connected callback for ' + deviceClicked.id);
        //TRY THIS TO ACCESS...
        console.log('From connected callback, p.name, p.id, p.services, p.services[0]:  ' + p.name + ',' + p.id + ', ' + JSON.stringify(p.services) + ', ' + p.services[0]);
        connectedDevices.push(deviceClicked);
        //TODO CHECK/START ONLY SERVICES/CHAR
        //CHECK TO SEE IF HR VS CSC

        var t1 = _.includes(p.services, '180d');
        var t2 = _.includes(p.services, '180D');

        if ((t1) || (t2)) {
            console.log('is HR');
            ble.startNotification(deviceClicked.id, "180d", "2a37", function(b) {
                var data = new Uint8Array(b);
                console.log('notify success HR: ' + data[1] );
                //TODO:  UPDATE UI VALUE, UPDATE UI CHIP
                updateHeartrateChip(p.name, 1, data[1]);
            }, function(e) {
                console.log('notify failure HR, try speed:  ' + e);
                //try to set speed notify...
                // console.log('speed test for notify, ' + deviceClicked.id);
                // ble.startNotification(deviceClicked.id), "1816", "2A5B", function(bb) {var datadata = new Uint8Array(bb);console.log('notify speed success, ' + JSON.stringify(bb));}, function(e) {console.log('e: ' + e);};
            });

        } else {
            console.log('is CSC', + deviceClicked.name) ;
            ble.startNotification(deviceClicked.id, "1816", "2A5B", function(bb) {
                var data_csc = new Uint8Array(bb);
                console.log('notify success CSC: ' + data_csc[1] );
                //TODO:  UPDATE UI VALUE, UPDATE UI CHIP
                updateHeartrateChip(p.name, 2, data_csc[1]);
            }, function(e) {
                console.log('notify failure HR, try speed:  ' + e);
            });
            
        }

    }, function(p) {
        console.log('disconnected callback:  ' + JSON.stringify(p));
    }

    );

    
}  //end start bluetooth connection

function updateHeartrateChip(n, i, d) {
    console.log('updateHeartrateChip:  ' + n + ', ' + i + ', ' + d);

    if (i ==1) {

        $$('.chip-hr').html('<div class="chip-media bg-color-green">' +
        '<i class="fa fa-heartbeat fa-lg"></i></div>' +
        ' <div class="chip-label">HR: ' + String(d) + ' </div>'); 


        //$$('.chip-hr').empty();
        //$$('.chip-hr').html('<div class="chip-media bg-color-green"><i class="fa fa-heartbeat fa-lg"></i></div><div class="chip-label">Heartrate ' + d + ' </div>');
    }
    if (i ==2) {

        $$('.chip-csc').html('<div class="chip-media bg-color-green">' +
        '<i class="fa fa-bluetooth-b fa-lg"></i></div>' +
        ' <div class="chip-label">Spd/Cad: '+ String(d) +' </div>'); 

    }

}

function testChipUpdate(c, v) {
    $$('.chip-hr').html('<div class="chip-media bg-color-green">' +
    '<i class="fa fa-heartbeat fa-lg"></i></div>' +
    ' <div class="chip-label">Heartrate</div>'); 
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
    ble.scan([], 2, function (device) {
        console.log(JSON.stringify(device));
        if (device.name) {
            scannedDevices.push(device);
            $$('.status-alerts').text('Found: ' + device.name);
        }
    }, function (e) {
        console.log('failure, ' + e);
    });

    setTimeout(function () {
        console.log('scan complete, calling postScan');
        scannedDevices = _.uniqBy(scannedDevices, 'id');
        postScan(); 
    
    },
        3000
    );
}
