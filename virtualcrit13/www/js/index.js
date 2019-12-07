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
    popup: {
        closeByBackdropClick: true,
    },
    statusbar: {
        androidOverlaysWebView: false,
        iosOverlaysWebview: true,
        iosTextColor: 'white',
        androidTextColor: 'white',
    },
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
    callback: tockCallback,  //EVERY SECOND
    complete: tockComplete   //EVERY ROUND
});

//var secondsPerRound = 60;
var roundsComplete = 0;
var totalElapsedTime;

function tockCallback() {
    //console.log('tockCallback');
    var countdownTime = timer.lap();  //elapsed in milli, per round

    totalElapsedTime = _.now() - startTime;
    $$('.total-time').text(timer.msToTimecode(totalElapsedTime));
    $$('.system-status').text("Running");
}

//END OF ROUND
function tockComplete() {
    roundsComplete += 1;
    console.log('tockComplete, roundsComplete: ' + roundsComplete);
    timer.start((tim.timSecondsPerRound - 1) * 1000);
    newRound();
}

function newRound() {
    console.log('newRound');
    arrRoundDistances.push(totals.distance);  //already in miles

    console.log('arrRoundDistances\n', JSON.stringify(arrRoundDistances));

    let a = _.last(arrRoundDistances);
    let b = _.nth(arrRoundDistances, -2)
    console.log('a,b', a,b);
    let distanceInMostRecendRound = a - b;  //miles
    console.log('distanceInMostRecendRound', distanceInMostRecendRound);

    //ret1string((totalDistance * 0.62137) / (totalActivyTime / 1000 / 60 / 60));

    round.speed = ret1num( distanceInMostRecendRound / (tim.timSecondsPerRound / 60 / 60) );
    console.log('round.speed', round.speed);
    console.log('tim.timAudio', tim.timAudio);
    console.log('attempt to play audio');

    $$('.main-status-alerts').html('MY LAST CRIT:  ' + round.speed + ' MPH');
    
    if (tim.timAudio == "ON") {
        if (round.speed > 0) {
            TTS.speak({
                text: ret1string(round.speed) + ' Miles Per Hour.',
                locale: 'en-US',
                rate: 1.5
            }, function () {
                console.log('tts success');
            }, function (reason) {
                console.log('tts failed:  ', reason);
            });
        }
    }

    if (heartrateReadingsRound.length > 0) {
        round.heartrate = ret1num(_.mean(heartrateReadingsRound));
        //console.log('round.heartrate:', round.heartrate);
        heartrateReadingsRound = [];
    }

    postRound();  //which will call postTotals

}


var scannedDevices = [];
function postScan() {

    console.log('starting postScan');
    scannedDevices = _.uniqBy(scannedDevices, 'id');
    console.log("scannedDevices:  " + JSON.stringify(scannedDevices));

    $$('.device-ul').empty();
    scannedDevices.forEach(element => {
        console.log('postScan forEach Element:  ' + JSON.stringify(element));
        $$('.device-ul').append('<li class="device-li"> <a href="#" class="item-link item-content no-chevron"> <div class="item-media"><i class="fa fa-arrow-circle-o-right fa-lg"></i></div> <div class="item-inner"> <div class="item-title"> <div class="item-header device-service"></div> <span class="device-name">' + element.name + '</span><div class="item-footer device-id">' + element.id + '</div></div> <div class="item-after device-status">.</div></div> </a> </li>');
    });
    console.log('postScan Complete');
    $$('.status-alerts').html('Updated');
}

$$('.start-bluetooth-scan').on('click', function (e) {
    console.log('click ble link');
    startBluetoothScan();
});

$$('.device-ul').on('click', 'li', function (e) {
    console.log('clicked a ble device');
    $$('.status-alerts').html('Connecting ...');
    var clickedDeviceIndex = $$(this).index();
    console.log(clickedDeviceIndex);
    // startBluetoothConnection(clickedDeviceIndex);
    setTimeout(startBluetoothConnection, 2000, clickedDeviceIndex);
});


$$('.device-ul').on('taphold', 'li', function (e) {
    console.log('clicked a ble device, longclick');
    var clickedDeviceIndex = $$(this).index();
    console.log(clickedDeviceIndex);
    startBluetoothDisconnection(clickedDeviceIndex);
});

function startBluetoothDisconnection(i) {
    var deviceClicked = scannedDevices[i];
    console.log('startBluetoothDisconnection:  ' + scannedDevices[i].name);
    //TODO:  CHANGE TO SERVICES/CHAR INUSE
    ble.stopNotification(deviceClicked.id, "180d", "2a37", function (s) {
        console.log('stop notify success, calling disconnect');
        ble.disconnect(deviceClicked.id, function () { console.log('disconnect success'); }, function () { console.log('disconnect failed'); });
    }, function (e) {
        console.log('stop notify failure');
    });

    ble.stopNotification(deviceClicked.id, "1816", "2A5B", function (s) {
        console.log('stop notify success, calling disconnect CSC');
        ble.disconnect(deviceClicked.id, function () { console.log('disconnect success CSC'); }, function () { console.log('disconnect failed CSC'); });
    }, function (e) {
        console.log('stop notify failure CSC');
    });

}

var connectedDevices = [];  //Peripheral Object
var heartrateReadings = [];
var heartrateReadingsRound = [];

function startBluetoothConnection(i) {
    console.log('startBluetoothConnection for index: ' + i);
    changeLi(i, '...');
    if (scannedDevices.length < 1) { return };
    var deviceClicked = scannedDevices[i];  //TODO, MAYBE PUBLIC VAR?
    console.log('deviceClicked:  ' + deviceClicked.id + ', ' + deviceClicked.name);
    connectedDevices.push(deviceClicked);
    ble.connect(deviceClicked.id, function (p) {
        console.log('connected callback for ' + deviceClicked.id);
        //TRY THIS TO ACCESS...
        console.log('From connected callback, p.name, p.id, p.services, p.services[0]:  ' + p.name + ',' + p.id + ', ' + JSON.stringify(p.services) + ', ' + p.services[0]);
        connectedDevices.push(deviceClicked);
        $$('.status-alerts').html('Connected: ' + p.name);
        changeLi(i, '....');
        //TODO CHECK/START ONLY SERVICES/CHAR
        //CHECK TO SEE IF HR VS CSC

        var t1 = _.includes(p.services, '180d');
        var t2 = _.includes(p.services, '180D');
        var t3 = _.includes(p.services, '1816');

        if ((t1) || (t2)) {
            console.log('is HR');
            changeLi(i, 'HR');
            ble.startNotification(deviceClicked.id, "180d", "2a37", function (b) {
                var data = new Uint8Array(b);
                console.log('notify success HR: ' + data[1]);

                updateChip(p.name, 1, data[1]);
                ui('.item-hr', ret0string(data[1]) + ' BPM');
                heartrateReadings.push(data[1]);
                heartrateReadingsRound.push(data[1]);
                ui('.item-hr-avg', (_.mean(heartrateReadings).toFixed(1)) + ' BPM (AVG)');
                totals.heartrate = ret1num(_.mean(heartrateReadings));

                if (popupGauge) {
                    var gauge2 = app.gauge.get('.my-gauge2');
                    gauge2.update({
                        value: (data[1] / 2) / 100,
                        valueText: ret0string(data[1]),
                    });
                }




            }, function (e) {
                console.log('notify failure HR:  ' + e);
            });
        }

        if (t3) {
            // if (isNaN(deviceClicked.name)) {return};
            console.log('is CSC', + p.name);
            //TODO, WHY DOES P.NAME WORK BUT NOT DEVICECLICKED.NAME???
            changeLi(i, 'SPD/CAD');
            if (t1 == true || t2 == true) { changeLi(i, 'SPD/CAD/HR'); }
            ble.startNotification(deviceClicked.id, "1816", "2A5B", function (bb) {
                console.log('start notification CSC');
                
                calcSpeedCadenceValues(bb);
                var data_csc = new Uint8Array(bb);
                //console.log('notify success CSC: ' + data_csc[1]);
                //TODO:  UPDATE UI VALUE, UPDATE UI CHIP
                // updateChip(p.name, 2, data_csc[1]);
            }, function (e) {
                console.log('notify failure CSC:  ' + e);
            });
        }

        if (isNaN(p.name)) {
            console.log('isNan');
        }

    }, function (p) {
        console.log('disconnected callback:  ' + JSON.stringify(p));
        $$('.status-alerts').html('Disconnected: ' + p.name);
        var tt = _.findIndex(scannedDevices, ['id', p.id]);
        console.log('found the index for the disconnected device  ' + p.name + ', index: ' + tt);
        console.log('waiting 15 seconds before issuing a new start BluetoothConnection');
        setTimeout(startBluetoothConnection, 15000, tt);
    }
    );


}  //end start bluetooth connection

var reconnectRequests = [];

function updateChip(n, i, d) {
    // console.log('updateChip:  ' + n + ', ' + i + ', ' + d);

    if (i == 0) {

        $$('.chip-gps').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-bluetooth-b fa-lg"></i></div>' +
            ' <div class="chip-label">GPS: ' + String(d) + ' </div>');
    }

    if (i == 1) {

        $$('.chip-hr').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-heartbeat fa-lg"></i></div>' +
            ' <div class="chip-label">HR: ' + String(d) + ' </div>');
    }
    if (i == 2) {

        $$('.chip-csc').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-bluetooth-b fa-lg"></i></div>' +
            ' <div class="chip-label">Spd: ' + String(d) + ' </div>');
    }

    if (i == 3) {

        $$('.chip-cad').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-bluetooth-b fa-lg"></i></div>' +
            ' <div class="chip-label">Cad: ' + String(d) + ' </div>');
    }


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
    // $$('.device-ul').empty();
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

function changeLi(i, v) {
    console.log('changeLi');
    //GET THE LI BY IDEX
    var a = $$('.device-li').eq(i);
    console.log($$(a).find('.device-status').html());
    //SET THE VALUE...
    // $$(a).find('.device-status').empty();
    var b = $$(a).find('.device-status').text(v);
    // console.log('a:' + a);
    // console.log('a:' + b);
    //var c = $$(a).find('.device-status').html();
    console.log($$(a).find('.device-status').html());
}

var arrRoundDistances = [];

var startTime;
function startup() {
    console.log('startup function');
    var totalTime = '00:00:00';
    var systemStatus = "Stopped";
    arrRoundDistances.push(0);
    $$('.total-time').text(totalTime);
    $$('.system-status').text(systemStatus);

    //LOCAL STORAGE ON STARTUP
    //name
    var g = localStorage.getItem('timName');
    console.log('timName: ' + g);
    if (g) {
        tim.timName = g;
        $$(".span-timName").text(tim.timName);
    } else {
        localStorage.setItem('timName', tim.timName);
        $$(".span-timName").text(tim.timName);
    }

    //audio
    if (localStorage.getItem('timAudio')) {
        tim.timAudio = localStorage.getItem('timAudio');
        $$(".span-timAudio").text(tim.timAudio);
    } else {
        localStorage.setItem('timAudio', tim.timAudio);
        $$(".span-timAudio").text(tim.timAudio);
    };

    //maxhr
    if (localStorage.getItem('timMaxHeartate')) {
        tim.timMaxHeartate = parseInt(localStorage.getItem('timMaxHeartate'));
        $$(".span-timMaxHeartate").text(tim.timMaxHeartate.toString());
    } else {
        localStorage.setItem('timMaxHeartate', tim.timMaxHeartate.toString());
        $$(".span-timMaxHeartate").text(tim.timMaxHeartate.toString());
    };

    //tiresize
    if (localStorage.getItem('timWheelSize')) {
        tim.timWheelSize = parseInt(localStorage.getItem('timWheelSize'));
        $$(".span-timWheelSize").text(tim.timWheelSize.toString());
    } else {
        localStorage.setItem('timWheelSize', tim.timWheelSize.toString());
        $$(".span-timWheelSize").text(tim.timWheelSize.toString());
    };

    // listenTotals();
}

$$('.start-system').on('click', function (e) {
    console.log('click start-system');
    timerStarter();
    // if (startTime) {
    //     console.log('running');
    //     return;
    // };

    // startTime = _.now();
    // timer.start(tim.timSecondsPerRound * 1000); //Set round duration for cb
    // listenTotals();

    // setTimeout(function() {
    //     listenRounds();
    // }, 10000);
});

function timerStarter() {
    console.log('timerStarter');

    if (startTime) {
        console.log('already running');
        return;
    };
    startTime = _.now();
    timer.start(tim.timSecondsPerRound * 1000); //Set round duration for cb

    TTS.speak({
        text: 'Here we go!',
        locale: 'en-US',
        rate: 1.5
    }, function () {
        console.log('tts success');
    }, function (reason) {
        console.log('tts failed:  ', reason);
    });


    setTimeout(function () {
        listenTotals();
    }, 10000);

    setTimeout(function () {
        listenRounds();
    }, 10000);

    setTimeout(function () {
        listenRoundsHR();
    }, 15000);
}


$$('.start-gps').on('click', function (e) {
    console.log('click start-gps');
    var t = $$('.gps-item-after').text();
    if (t == 'ON') {
        console.log('already started');
        return;
    }

    $$('.gps-item-header').text('');
    $$('.gps-item-after').text('ON');
    startGPSTracking();
});

$$('.start-gps').on('dblclick', function (e) {
    console.log('click start-gps, taphold, start sim');
    $$('.gps-item-header').text('');
    $$('.gps-item-after').text('ON');
    // startGPSTracking();
    startLocationSimulator();
});
$$('.start-gps').on('taphold', function (e) {
    console.log('click start-gps, taphold, start sim');
    $$('.gps-item-header').text('');
    $$('.gps-item-after').text('ON');
    // startGPSTracking();
    startLocationSimulator();
});

//SET NAME
$$('.item-timName').on('click', function (e) {
    console.log('click timName');

    app.dialog.prompt('RIDER NAME', '', function (x) {
        console.log('OK: x', x);
        tim.timName = x.toUpperCase();
        $$('.span-timName').text(tim.timName);
        localStorage.setItem('timName', tim.timName);
    }, function (y) {
        console.log('Cancel: y: ', y);
        tim.timName = y.toUpperCase();
        $$('.span-timName').text(tim.timName);
        localStorage.setItem('timName', tim.timName);
    }, tim.timName);
});

//SET AUDIO
$$('.item-timAudio').on('click', function (e) {
    console.log('click timAudio');

    if ($$('.span-timAudio').text() == "OFF") {
        $$('.span-timAudio').text("ON");
        localStorage.setItem('timAudio', "ON");
    } else {
        $$('.span-timAudio').text("OFF");
        localStorage.setItem('timAudio', "OFF");
    }
});

//SET MAXHR
$$('.item-timMaxHeartate').on('click', function (e) {
    console.log('click timMaxHeartate');

    tim.timMaxHeartate += 5;
    console.log('tim.timMaxHeartate  ', tim.timMaxHeartate);
    if (tim.timMaxHeartate > 210) {
        tim.timMaxHeartate = 185;
    }
    $$('.span-timMaxHeartate').text(tim.timMaxHeartate);
    localStorage.setItem('timMaxHeartate', tim.timMaxHeartate.toString());
});

//SET WHEELSIZE
$$('.item-timWheelSize').on('click', function (e) {
    console.log('click timWheelSize');

    tim.timWheelSize += 10;
    if (tim.timWheelSize > 2220) {
        tim.timWheelSize = 2100;
    }
    $$('.span-timWheelSize').text(tim.timWheelSize);
    localStorage.setItem('timWheelSize', tim.timWheelSize.toString());

});


// START LOCATION CALC

function startGPSTracking() {
    console.log('startGPSTracking');


    BackgroundGeolocation.configure({
        // locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
        desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
        activityType: 'Fitness',
        //TODO...THIS IS TOO AGRESSIVE
        stationaryRadius: 5,
        distanceFilter: 5,
        notificationTitle: 'Background tracking',
        notificationText: 'enabled',
        //debug: true,
        interval: 5000,
        fastestInterval: 2000,
        activitiesInterval: 5000,
    });

    BackgroundGeolocation.on('start', () => {
        console.log('[DEBUG] BackgroundGeolocation has been started');
        $$('.main-status-alerts').text("GPS Tracking Started");
    });

    BackgroundGeolocation.on('location', function (location) {
        console.log('new location arrived');

        let l = {
            latitude: location.latitude,
            longitude: location.longitude
        };
        // console.log('calling onBackgroundSuccess');
        onBackgroundSuccess(l);

    });

    BackgroundGeolocation.on('error', function (error) {
        console.log('[ERROR] BackgroundGeolocation error:', error.code, error.message);
        //$$('.main-status-alerts').text(error + ' GPS Error');
    });

    BackgroundGeolocation.on('stop', function () {
        console.log('[INFO] BackgroundGeolocation service has been stopped');
    });

    BackgroundGeolocation.on('background', function () {
        console.log('[INFO] App is in background');
        // you can also reconfigure service (changes will be applied immediately)
        //BackgroundGeolocation.configure({ debug: true });
    });

    BackgroundGeolocation.on('foreground', function () {
        console.log('[INFO] App is in foreground');
        //BackgroundGeolocation.configure({ debug: false });
    });

    BackgroundGeolocation.on('stationary', function (stationaryLocation) {
        console.log('[INFO] stationary');
        $$('.main-status-alerts').text('Stationary');
    });

    //   BackgroundGeolocation.on('authorization', function(status) {
    //     console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
    //     if (status !== BackgroundGeolocation.AUTHORIZED) {
    //       // we need to set delay or otherwise alert may not be shown
    //       setTimeout(function() {
    //         var showSettings = confirm('App requires location tracking permission. Would you like to open app settings?');
    //         if (showSettings) {
    //           return BackgroundGeolocation.showAppSettings();
    //         }
    //       }, 1000);
    //     }
    //   });


    BackgroundGeolocation.checkStatus(function (status) {
        console.log('[INFO] BackgroundGeolocation service is running', status.isRunning);
        console.log('[INFO] BackgroundGeolocation services enabled', status.locationServicesEnabled);
        console.log('[INFO] BackgroundGeolocation auth status: ' + status.authorization);
        //$$('.main-status-alerts').text('[INFO] BackgroundGeolocation service is running', status.isRunning);
        console.log('BackgroundGeo is Running');


        // you don't need to check status before start (this is just the example)
        if (!status.isRunning) {
            console.log('issue start command');
            BackgroundGeolocation.start(); //triggers start on start event
        }
    });
}

var lastLatitude = -2;
var lastLongitude = -1;
var lastActivityTime = 0;

var totalDistance = 0;
var totalActivyTime = 0;

var gpsAvgSpeed = -1;
var gpsSpeed = -1;

function onBackgroundSuccess(newLocation) {
    // console.log('onBackgroundSuccess');

    if (lastLatitude == -2) {
        lastLatitude = -1;
        console.log('init reading');

    }

    if (lastLatitude == -1) {
        console.log('onBackgroundSuccess - first reading');
        lastLatitude = newLocation.latitude;
        lastLongitude = newLocation.longitude;
        lastActivityTime = _.now();  //ms

        timerStarter();
        return;
    }
    //console.log('onBackgroundSuccess - new, good reading');

    //STOP THE CLOCK
    if (lastActivityTime - _.now() > 15000) {

        lastActivityTime = _.now();
        return;
    }


    var R = 6371; // Radius of the earth in km
    var dLat = (newLocation.latitude - lastLatitude) * (Math.PI / 180);  // deg2rad below
    var dLon = (newLocation.longitude - lastLongitude) * (Math.PI / 180);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lastLatitude * (Math.PI / 180)) * Math.cos(newLocation.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c; // Distance in KM

    if (distance < .01 || _.now() - lastActivityTime < 2000) {
        return;
    }

    totalDistance += distance;  //Total Distance in KM
    // console.log('Total Distance in Miles ' + (totalDistance * 0.62137));
    $$('.item-distance').text((ret2string(totalDistance * 0.62137)) + ' Miles');

    var activityTime = (_.now() - lastActivityTime);  //in MS
    totalActivyTime += activityTime; //in MS

    gpsAvgSpeed = ret1string((totalDistance * 0.62137) / (totalActivyTime / 1000 / 60 / 60));
    gpsSpeed = ret1string((distance * 0.62137) / (activityTime / 1000 / 60 / 60));
    updateChip('gpsSpeed', 0, gpsSpeed + ' Mph');

    ui('.item-speed', gpsSpeed + ' MPH');
    ui('.item-average-speed', gpsAvgSpeed + 'MPH (AVG)');
    ui('.item-distance', ret2string(totalDistance * 0.62137) + ' MILES');
    totals.speed = ret1num((totalDistance * 0.62137) / (totalActivyTime / 1000 / 60 / 60));
    totals.distance = ret2num(totalDistance * 0.62137);

    if (popupGauge) {
        var gauge = app.gauge.get('.my-gauge');
        gauge.update({
            value: (parseFloat(gpsSpeed) * 3.75) / 100,
            valueText: gpsSpeed,
        });
    }



    //console.log('main location alert: ' + gpsSpeed + " mph, " + gpsAvgSpeed + " avg, " + msToTime(totalActivyTime));
    //$$('.main-status-alerts').text(gpsSpeed + " mph, " + gpsAvgSpeed + " avg, " + msToTime(totalActivyTime));

    lastLatitude = newLocation.latitude;
    lastLongitude = newLocation.longitude;
    lastActivityTime = _.now();
}

// END LOCATION CALC


function ret1num(n) {
    return (Math.round(n * 10) / 10)
}

function ret2num(n) {
    return (Math.round(n * 100) / 100)
}

function ret0string(n) {
    return ((Math.round(n * 10)) / 10).toFixed(0);
}
function ret1string(n) {
    return ((Math.round(n * 10)) / 10).toFixed(1);
}
function ret2string(n) {
    return ((Math.round(n * 100)) / 100).toFixed(2);
}
function msToTime(s) {  //hh:mm:ss
    // Pad to 2 or 3 digits, default is 2
    var pad = (n, z = 2) => ('00' + n).slice(-z);
    return pad(s / 3.6e6 | 0) + ':' + pad((s % 3.6e6) / 6e4 | 0) + ':' + pad((s % 6e4) / 1000 | 0);
}



//BLUETOOTH CSC CALCULATOR
const UINT16_MAX = 65536;  // 2^16
const UINT32_MAX = 4294967296;  // 2^32
const updateRatio = 0.85; // Percent ratio between old/new stats

// var bluetoothStats, startDistance;
// var bluetoothSpeedActiveTime = 0;
// var bluetoothSpeedAverage;  //km/hr
// var bluetoothCadenceAverage;


//var wheelSize = 2111;
var bluetoothValues = {
    heartrate : -1,
    heartrateAverage : -1,
    speed : -1,
    speedAverage : -1,
    distance : -1,
    activeTime : -1,
    speedRound : -1,
}

var currentSample;
var previousSample;
var hasWheel;
var hasCrank;

var totalWheelRevs;
var totalWheelTime;
var totalCrankRevs;
var totalCrankTime;
var sampleWheelRevs;
var sampleWheelTime;


function calcSpeedCadenceValues(v) {
    console.log('calcSpeedCadenceValues');

    let v0 = new Uint8Array(v);
    let value = new DataView(v);

    let flags = v0[0];
    hasWheel = flags === 1 || flags === 3;
    hasCrank = flags === 2 || flags === 3;

    

    if (hasCrank) {
        currentSample = {
            wheel: value.getUint32(1, true),
            wheelTime: value.getUint16(5, true),
            crank: value.getUint16(7, true),
            crankTime: value.getUint16(9, true),
        };
    } else {
        currentSample = {
            wheel: value.getUint32(1, true),
            wheelTime: value.getUint16(5, true),
            // crank: value.getUint16(7, true),
            // crankTime: value.getUint16(9, true),
        };
    }

    console.log(JSON.stringify(previousSample), JSON.stringify(currentSample));
    if (!previousSample) {
        console.log('first time through, prev = current');
        previousSample = currentSample;
        return;
    } else {
        console.log('calling calc stats');
        //calculateStats();
        if (hasWheel) {
            calculateSpeed();
        }
    }

    // if (bluetoothStats) {
    //     // var data = "\nCadence (rpm): " + bluetoothStats.cadence.toFixed(1) + "\n";
    //     // data += "Distance (km): " + bluetoothStats.distance.toFixed(2) + "\n";
    //     // data += "Speed (km/hr): " + bluetoothStats.speed.toFixed(1);
    //     var data = "\nCadence (rpm): " + bluetoothStats.cadence + "\n";
    //     data += "Distance (km): " + bluetoothStats.distance + "\n";
    //     data += "Speed (km/hr): " + bluetoothStats.speed;
    //     data += "Avg.Speed (km/hr): " + bluetoothStats.avgSpeed;
    //     data += "Active Time (seconds): " + msToTime(bluetoothStats.totalActivyTime);
    //     console.log('data:  ' + data);
    //     //console.log('ret1string values:  ' + ret1string(bluetoothStats.cadence), ret1string(bluetoothStats.distance), ret1string(bluetoothStats.speed));
    //     if (bluetoothStats.speed) { ui('.item-speed-bt', ret1string(bluetoothStats.speed * 0.62137) + ' MPH'); updateChip('na', 2, ret1string(bluetoothStats.speed * 0.62137) + ' Mph'); } //convert to mph
    //     if (bluetoothStats.cadence) { ui('.item-cadence', + ret0string(bluetoothStats.cadence) + ' RPM'); updateChip('na', 3, ret0string(bluetoothStats.cadence) + ' Rpm'); }
    //     if (bluetoothStats.distance) { ui('.item-distance-bt', ret2string(bluetoothStats.distance * 0.62137) + ' MPH'); $$('.item-distance-bt').text((ret2string(bluetoothStats.distance * 0.62137)) + ' Miles'); }
    //     if (bluetoothStats.avgSpeed) { ui('.item-average-speed-bt', ret1string(bluetoothSpeedAverage * 0.62137) + ' MPH'); } //convert to mph
    //     if (totals.distance < 1 && bluetoothStats.distance > 2) {
    //         //not using gps
    //         totals.distance = rel2num(ret2string(bluetoothStats.distance * 0.62137));
    //         totals.speed = rel1num(ret1string(bluetoothSpeedAverage * 0.62137));
    //     }

    //     // ui('item-speed-bt',ret1string(bluetoothStats.speed * 0.62137) + ' MPH');
    //     //ui('item-average-speed-bt', + ' MPH (AVG)');
    //     // ui('item-distance-bt', ret2string(bluetoothStats.distance * 0.62137) + ' MPH');
    //     //ui('item-cadence', + ret0string(bluetoothStats.cadence) + ' RPM');

    // }
}

function diffForSample(current, previous, max) {
    if (current >= previous) {
        return current - previous;
    } else {
        return (max - previous) + current;
    }
}



function calculateSpeed() {
console.log('calculateSpeed');

sampleWheelTime = diffForSample(currentSample.wheelTime, previousSample.wheelTime, UINT16_MAX);
sampleWheelTime = sampleWheelRevs / 1024;  //seconds

sampleWheelRevs = diffForSample(currentSample.wheel, previousSample.wheel, UINT32_MAX);
// sampleWheelRevs = sampleWheelRevs * tim.timWheelSize; //meters
// sampleWheelRevs = sampleWheelRevs / 1000 * 0.62137;  //miles

totalWheelRevs += sampleWheelRevs;
totalWheelTime += sampleWheelTime;

bluetoothValues.activeTime = totalWheelTime;  //seconds
bluetoothValues.distance = ((totalWheelRevs * tim.timWheelSize) / 1000 / 1000) * 0.62137; 

sampleDistance = ((sampleWheelRevs * tim.timWheelSize) / 1000 / 1000) * 0.62137; 

bluetoothValues.speedAverage = bluetoothValues.distance / (bluetoothValues.activeTime / 60 / 60);
bluetoothValues.speed = sampleDistance / (sampleWheelTime / 60 / 60);

console.log('calcSpeedValues ', sampleWheelTime, sampleWheelRevs, totalWheelTime, totalWheelRevs, sampleDistance);
console.log('btval ', JSON.stringify(bluetoothValues));

previousSample = currentSample;

}

function OLDcalculateStatsOLD() {
    console.log('calculateStats Start');

    if (!previousSample) {
        console.log('!preiousSample');
        startDistance = currentSample.wheel * tim.timWheelSize / 1000 / 1000; // km
        previousSample = currentSample;
        return;
    }

    var distance, cadence, speed;
    if (hasWheel) {
        console.log('hasWheel');
        let wheelTimeDiff = diffForSample(currentSample.wheelTime, previousSample.wheelTime, UINT16_MAX);
        console.log('wheelTimeDiff', wheelTimeDiff);
        
        wheelTimeDiff /= 1024; // Convert from fractional seconds (roughly ms) -> full seconds
        let wheelDiff = diffForSample(currentSample.wheel, previousSample.wheel, UINT32_MAX);
        console.log('wheelDiff', wheelDiff);
        

        var sampleDistance = wheelDiff * tim.timWheelSize / 1000; // distance in meters
        console.log('sampleDistance', sampleDistance);
        
        if (wheelTimeDiff < 10 && sampleDistance > 0 && sampleDistance < 10) {
            totalWheelTime += wheelTimeDiff;
            totalWheelRevs += wheelDiff;
            console.log('totalWheelTime, totalWheelRevs ', totalWheelTime, totalWheelRevs);
            

            //speed = (wheelTimeDiff == 0) ? 0 : sampleDistance / totalWheelTime * 3.6; // km/hr
            speed = (sampleDistance / 1000 * 0.62137) / (wheelTimeDiff / 60 / 60);
            distance = ((totalWheelRevs * tim.timWheelSize) / 1000 / 1000) * 0.62137;  //mi
            bluetoothSpeedAverage = distance / (totalWheelTime / 60 / 60) * 0.62137;  //mi/hr
            console.log('spd, dist, avg ', speed, distance, bluetoothSpeedAverage);
            
        }

    }

    if (hasCrank) {
        console.log('hasCrank');

        let crankTimeDiff = diffForSample(currentSample.crankTime, previousSample.crankTime, UINT16_MAX);
        crankTimeDiff /= 1024; // Convert from fractional seconds (roughly ms) -> full seconds
        let crankDiff = diffForSample(currentSample.crank, previousSample.crank, UINT16_MAX);

        totalCrankRevs += crankDiff;
        totalCrankTime += crankTimeDiff;

        cadence = (crankTimeDiff == 0) ? 0 : (60 * crankDiff / crankTimeDiff); // RPM
        bluetoothCadenceAverage = (60 * totalCrankRevs / totalCrankTime); // RPM
    }

    if (bluetoothStats) {
        console.log('bluetoothStats has a value');

        bluetoothStats = {
            cadence: bluetoothStats.cadence * (1 - updateRatio) + cadence * updateRatio,
            distance: distance,
            speed: bluetoothStats.speed * (1 - updateRatio) + speed * updateRatio,
            avgSpeed: bluetoothSpeedAverage,
            avgCadence: bluetoothCadenceAverage,
            activeTime: bluetoothSpeedActiveTime
        };
        console.log('bluetoothStats1: ' + JSON.stringify(bluetoothStats));

    } else {
        bluetoothStats = {
            cadence: cadence,
            distance: distance,
            speed: speed
        };
        console.log('bluetoothStats2: ' + JSON.stringify(bluetoothStats));
    }
    previousSample = currentSample;
}
// END BLUETOOTH CALC


// LOCATION SIMULATOR
var fakeLat = 40.6644403;
var fakeLon = -73.9712484;
function startLocationSimulator() {
    console.log('locationSimulator');
    setInterval(function () {
        let l = {
            latitude: fakeLat,
            longitude: fakeLon
        };
        onBackgroundSuccess(l);
        let rn = _.random(.00005, .00015);
        // fakeLat += .0001;
        fakeLat += rn;
        fakeLon -= .0001;
    }, 2000);
}

// TEST NETWORK AVAILABILITY
var isNetworkAvailable = true;
document.addEventListener("offline", networkOfflineCallback, false);
document.addEventListener("online", networkOnlineCallback, false);

function networkOnlineCallback() {
    console.log('Network online');
    isNetworkAvailable = true;
}
function networkOfflineCallback() {
    console.log('Network offline');
    isNetworkAvailable = false;
}


//DATE FUNCTION
function getTodaysDate() {
    let today = new Date();
    var dd = today.getDate().toString();
    var mm = (today.getMonth() + 1).toString(); //January is 0!
    let yyyy = today.getFullYear().toString();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    let pubFullDate = yyyy + mm + dd;
    let pubFullTime = _.now();
    let pubMonth = mm;
    let pubDay = dd;
    let pubYear = yyyy;

    return pubFullDate
}


//UPDATE UI VALUES
// item-speed
// item-average-speed
// item-distance

// item-speed-bt
// item-average-speed-bt
// item-distance-bt

// item-hr
// item-hr-avg
// item-cadence

function ui(k, v) {
    // console.log('update ui');
    $$(k).text(v);
}


//DYANMIC POPUPS
//POPUP GAUGE
 var popupHtml = '<div id = "elem-to-center" class="popup center-popup">' +
        '<div class="block-header">SPEED/HEARTRATE</div>' +
        '<div class="block text-align-center">' +
            '<div class="gauge demo-gauge my-gauge"></div>' +
        '</div>' +
        '<div class="block text-align-center">' +
            '<div class="gauge2 demo-gauge2 my-gauge2"></div>' +
        '</div>' +
        '<div class="block-footer">SWIPE UP/DOWN TO DISMISS</div>' +
    '</div>';


// Create dynamic Popup
var dynamicPopup = app.popup.create({
    content: popupHtml,
    backdrop: true,
    closeByBackdropClick: true,
    swipeToClose: true,
    // Events
    on: {
        open: function (popup) {
            console.log('Popup open');

            var gauge = app.gauge.create({
                el: '.gauge',
                type: 'circle',
                value: 0.1,
                size: 230,
                borderColor: '#ff0000',
                borderWidth: 20,
                valueText: '0',
                valueFontSize: 55,
                valueTextColor: '#ff0000',
                valueFontWeight: 700,
                labelFontSize: 20,
                labelText: 'MPH',
                // valueText: 'Speed',
                on: {
                    beforeDestroy: function () {
                        console.log('Gauge will be destroyed')
                    },
                }
            })



            var gauge2 = app.gauge.create({
                el: '.gauge2',
                type: 'circle',
                value: 0.1,
                size: 230,
                borderColor: '#ff0000',
                borderWidth: 20,
                valueText: '0',
                valueFontSize: 55,
                valueTextColor: '#ff0000',
                valueFontWeight: 700,
                labelFontSize: 20,
                labelText: 'BPM',
                on: {
                    beforeDestroy: function () {
                        console.log('Gauge will be destroyed')
                    }
                }
            })

        },
        opened: function (popup) {
            console.log('Popup opened');
            popupGauge = true;
        },
    }
});
// Events also can be assigned on instance later
dynamicPopup.on('close', function (popup) {
    console.log('Popup close');
});
dynamicPopup.on('closed', function (popup) {
    popupGauge = false;
    console.log('Popup closed');
});

// Open dynamic popup from menu bars 
$$('.dynamic-pop').on('click', function () {
    dynamicPopup.open();
});

var popupGauge = false;
var popupCounter = 0;

//NOT USING...
function changePopupContent() {
    console.log('changePopupContent');  
    if (popupCounter == 0) {popupCounter += 1;return;}
    popupCounter += 1;
    var gauge = app.gauge.get('.my-gauge');
    gauge.destroy();
    var gauge2 = app.gauge.get('.my-gauge2');
    gauge2.destroy();
    $('#elem-to-center').html('<div class="block-header">NEW</div>' +
    '<div class="block text-align-center">' +
        '<div> SOMETHING IN THE MIDDLE </div>' +
    '</div>');
}

//TAB1 POPUP
var popupTab1 = false;
$$('.tab1').on('click', function() {
    console.log('tab1 click');

    var tab1Html = '<div id = "elem-to-center" class="popup center-popup">' +
    '<div class="block-header">LEADERS</div>' +
    '<div class="block text-align-center">' +
        '<span id = "tab1a">-</span>' +
    '</div>' +
    '<div class="block text-align-center">' +
        '-' +
    '</div>' +
    '<div class="block-footer">SWIPE TO DISMISS</div>' +
'</div>';


var dynamicPopupTab1 = app.popup.create({
    content: tab1Html,
    backdrop: true,
    closeByBackdropClick: true,
    swipeToClose: true,
    // Events
    on: {
        open: function (popup) {
            console.log('Popup open');
        },
        opened: function (popup) {
            console.log('Popup opened');
            popupTab1 = true;
        },
        closed: function (popup) {
            console.log('Popup closed');
            popupTab1 = false;
        },
    }
});

    dynamicPopupTab1.open();

});  //END, TAB1





