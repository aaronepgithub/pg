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
    $$('.center-main').html(timer.msToTimecode(totalElapsedTime));
    // $$('.left-main').html('<i class="fa fa-circle"></i>');
    $$('.system-status').text("Running");

    var rd = 0;
    if (totals.distance && arrRoundDistances.length > 0) {
        rd = totals.distance - _.last(arrRoundDistances);
        let rds = rd / (((countdownTime - tim.timSecondsPerRound) / 1000) / 60 / 60);

        if (_.isFinite(rd) && _.isFinite(rds)) {
            $$('.card1-content').html(ret1num(rd) + ' MILES/ROUND,  ' + ret1num(rds) + '  MPH/ROUND');
        }
    }

    $$('.card1-header').html('ROUND ' + roundsComplete);
    $$('.card1-footer').html(timer.msToTimecode(countdownTime));

}

//END OF ROUND
function tockComplete() {
    roundsComplete += 1;
    console.log('tockComplete, roundsComplete: ' + roundsComplete);
    timer.start((tim.timSecondsPerRound - 1) * 1000);
    newRound();
}

function newRound() {
    console.log('newRound, roundsComplete: ', roundsComplete);
    arrRoundDistances.push(totals.distance);  //already in miles

    // console.log('arrRoundDistances\n', JSON.stringify(arrRoundDistances));

    let a = _.last(arrRoundDistances);
    let b = _.nth(arrRoundDistances, -2)
    // console.log('a,b', a, b);
    let distanceInMostRecendRound = a - b;  //miles
    // console.log('distanceInMostRecendRound', distanceInMostRecendRound);

    //ret1string((totalDistance * 0.62137) / (totalActivyTime / 1000 / 60 / 60));

    round.speed = ret1num(distanceInMostRecendRound / (tim.timSecondsPerRound / 60 / 60));

    if (round.speed > 35) {
        round.speed = 0;
    }
    // console.log('round.speed', round.speed);
    // console.log('tim.timAudio', tim.timAudio);
    // console.log('attempt to play audio');

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
                        labelText: 'BPM',
                    });
                }




            }, function (e) {
                console.log('notify failure HR:  ' + e);
            });
        }

        if (t3) {
            // if (isNaN(deviceClicked.name)) {return};
            console.log('is CSC', + p.name);
            console.log('is CSC', + deviceClicked.name);
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
            '<i class="fa fa-globe"></i></div>' +
            ' <div class="chip-label">GPS: ' + String(d) + ' </div>');
    }

    if (i == 1) {

        $$('.chip-hr').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-heartbeat"></i></div>' +
            ' <div class="chip-label">Heartrate: ' + String(d) + ' </div>');
    }
    if (i == 2) {

        $$('.chip-csc').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-bluetooth-b"></i></div>' +
            ' <div class="chip-label">Speed: ' + String(d) + ' </div>');
    }

    if (i == 3) {

        $$('.chip-cad').html('<div class="chip-media bg-color-green">' +
            '<i class="fa fa-bluetooth-b"></i></div>' +
            ' <div class="chip-label">Cadence: ' + String(d) + ' </div>');
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
    ble.scan([], 3, function (device) {
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

    //mode
    if (localStorage.getItem('timMode')) {
        tim.timMode = localStorage.getItem('timMode');
        $$(".span-timMode").text(tim.timMode);
    } else {
        localStorage.setItem('timMode', tim.timMode);
        $$(".span-timMode").text(tim.timMode);
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


var physicalScreenHeight = 1136;
function timerStarter() {
    console.log('timerStarter');
    physicalScreenHeight = window.screen.height * window.devicePixelRatio;
    console.log('physicalScreenHeight ', physicalScreenHeight);

    if (startTime) {
        console.log('already running');
        return;
    };
    startTime = _.now();
    timer.start(tim.timSecondsPerRound * 1000); //Set round duration for cb
    $$('.center-main').html('');
    $$('.left-main').html('<div class="chip color-green"><div class="chip-label">ON</div></div>');


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
        console.log('listenTotals');
        listenTotals();
    }, 10000);

    setTimeout(function () {
        console.log('listenRounds');
        listenRounds();
    }, 15000);

    setTimeout(function () {
        console.log('listenRoundsLeader');
        listenRoundsLeader();
    }, 20000);

    setTimeout(function () {
        console.log('listenRoundsHR');
        listenRoundsHR();
    }, 25000);
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
    console.log('timAudio: ', tim.timAudio, $$('.span-timAudio').text());

    if ($$('.span-timAudio').text() == "OFF") {
        $$('.span-timAudio').text("ON");
        localStorage.setItem('timAudio', "ON");
        tim.timAudio = "ON";
    } else {
        $$('.span-timAudio').text("OFF");
        localStorage.setItem('timAudio', "OFF");
        tim.timAudio = "OFF";
    }
    console.log('timAudio: ', tim.timAudio);

});

//SET MODE
$$('.item-timMode').on('click', function (e) {
    console.log('click timMode', tim.timMode, $$('.span-timMode').text());

    if ($$('.span-timMode').text() == "OFF") {
        $$('.span-timMode').text("ON");
        localStorage.setItem('timMode', "ON");
        tim.timMode = "ON";
    } else {
        $$('.span-timMode').text("OFF");
        localStorage.setItem('timMode', "OFF");
        tim.timMode = "OFF";
    }
    console.log('tim.timMode: ', tim.timMode);

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
        locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
        desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
        activityType: 'Fitness',
        //TODO...THIS IS TOO AGRESSIVE??
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

    // console.log('geodistance, reading:  ' +  ret2string(distance * 1000));  //meters
    // console.log('geotime, reading:  ' +  ret0string(_.now() - lastActivityTime));  //ms
    

    if ((distance * 1000) < 2 || _.now() - lastActivityTime < 1500) {
        //console.log('too short, wait for the next one');
        return;
    }

    if (distance * 1000 > 50) {
        console.log('distance is too far, reset');
        lastLatitude = newLocation.latitude;
        lastLongitude = newLocation.longitude;
        lastActivityTime = _.now();
        return;
    }

    if (_.now() - lastActivityTime > 10000) {
        console.log('too long between readings, reset');
        lastLatitude = newLocation.latitude;
        lastLongitude = newLocation.longitude;
        lastActivityTime = _.now();
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


    if (tim.timMode == 'OFF') {
        totals.speed = ret1num((totalDistance * 0.62137) / (totalActivyTime / 1000 / 60 / 60));
        totals.distance = ret2num(totalDistance * 0.62137);
        $$('.right-main').html(ret2string(totalDistance * 0.62137) + ' MILES  ');

        if (popupGauge) {
            var gauge = app.gauge.get('.my-gauge');
            gauge.update({
                value: (parseFloat(gpsSpeed) * 3.75) / 100,
                valueText: gpsSpeed,
            });

            var gauge3 = app.gauge.get('.my-gauge3');
            gauge3.update({
                value: (parseFloat(gpsSpeed) * 3.75) / 100,
                valueText: gpsSpeed,
            });
        }
        if (popupGauge && totals.heartrate < 1) {
            if (popupGauge) {
                var gauge2 = app.gauge.get('.my-gauge2');
                gauge2.update({
                    value: (parseFloat(gpsSpeed) * 3.75) / 100,
                    valueText: gpsAvgSpeed,
                    labelText: 'AVG MPH',
                });
            }
        }
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
//const updateRatio = 0.85; // Percent ratio between old/new stats

var bluetoothValues = {
    heartrate: -1,
    heartrateAverage: -1,
    speed: -1,
    speedAverage: -1,
    distance: -1,
    activeTime: -1,
    speedRound: -1,
    cadence: -1,
}

var currentSample;
var previousSample;

var totalWheelRevs = 0.0;
var totalWheelTime = 0.0;
var totalCrankRevs = 0.0;
var totalCrankTime = 0.0;
var sampleWheelRevs = 0.0;
var sampleWheelTime = 0.0;


function calcSpeedCadenceValues(v) {
    // console.log('calcSpeedCadenceValues');

    let v0 = new Uint8Array(v);
    let value = new DataView(v);

    let flags = v0[0];
    let hasWheel = flags === 1 || flags === 3;
    let hasCrank = flags === 2 || flags === 3;



    if (hasWheel) {

        if (hasCrank) {
            // console.log('wheel and crank');
            currentSample = {
                wheel: value.getUint32(1, true),
                wheelTime: value.getUint16(5, true),
                crank: value.getUint16(7, true),
                crankTime: value.getUint16(9, true),
            };
        } else {
            // console.log('only wheel');
            currentSample = {
                wheel: value.getUint32(1, true),
                wheelTime: value.getUint16(5, true),
            };
        }

    } else {
        // console.log('only crank');
        currentSample = {
            // wheel: value.getUint32(1, true),
            // wheelTime: value.getUint16(5, true),
            crank: value.getUint16(1, true),
            crankTime: value.getUint16(3, true),
            // crank: value.getUint16(7, true),
            // crankTime: value.getUint16(9, true),
        };
    }

    //console.log(JSON.stringify(previousSample), JSON.stringify(currentSample));
    if (!previousSample) {
        // console.log('first time through, prev = current');
        previousSample = currentSample;
        timerStarter();
        return;
    } else {
        console.log('calling calc stats');
        //calculateStats();
        if (hasWheel) {
            calculateSpeed();
        }
        if (currentSample.crank > 0) {
            // console.log('has crank, process crank/time');
            // console.log(currentSample.crank, currentSample.crankTime);
            //TODO:  PROCESS CRANK...
            currentCadenceSample = { crank: currentSample.crank, crankTime: currentSample.crankTime }
            calculateCadence();
        }
    }


}

function diffForSample(current, previous, max) {
    if (current >= previous) {
        return current - previous;
    } else {
        return (max - previous) + current;
    }
}

//SAMPLE WHEEL DATA
// {"wheel":574,"wheelTime":43486} {"wheel":575,"wheelTime":44012}
// {"wheel":575,"wheelTime":44012} {"wheel":578,"wheelTime":45632}
// {"wheel":578,"wheelTime":45632} {"wheel":580,"wheelTime":46751}
// {"wheel":580,"wheelTime":46751} {"wheel":581,"wheelTime":47328}

var previousCadenceSample;
var currentCadenceSample = { crankTime: 0.0, crank: 0.0 };
var totalCrankRevs = 0; var totalCrankTime = 0;
var crankVals = [1, 2, 3, 4, 5, 6, 7];


function calculateCadence() {
    if (!previousCadenceSample) {
        previousCadenceSample = currentCadenceSample;
        return;
    }

    // console.log('calcCadence', JSON.stringify(currentCadenceSample));
    crankVals.push(currentCadenceSample.crank);
    crankVals.shift();
    // console.log('crankVals ', JSON.stringify(crankVals));



    var crankTimeDiff = 0.0;
    var crankDiff = 0.0;
    crankTimeDiff = diffForSample(currentCadenceSample.crankTime, previousCadenceSample.crankTime, UINT16_MAX);
    crankDiff = diffForSample(currentCadenceSample.crank, previousCadenceSample.crank, UINT16_MAX);

    // console.log('crankTimeDiff', crankTimeDiff);
    // console.log('crankDiff', crankDiff);


    if (crankDiff < 6) {
        // console.log('get a bigger sample');
        if (_.head(crankVals) == _.last(crankVals)) {
            updateChip('na', 3, 0 + ' RPM');
            ui('.item-cadence', 0 + ' RPM');
        }
        return;
    }

    if (crankDiff > 15 || crankTimeDiff > 15000) {
        // console.log('too long for crank update, reset, return');
        previousCadenceSample = currentCadenceSample;
        return;
    }

    totalCrankRevs += crankDiff;
    totalCrankTime += crankTimeDiff;  //raw
    // console.log('totals', totalCrankRevs, totalCrankTime);

    cadence = ((crankDiff) / (crankTimeDiff / 1024 / 60)); // RPM
    bluetoothCadenceAverage = (totalCrankRevs / (totalCrankTime / 1024 / 60)); // RPM TOTAL AVG
    bluetoothValues.cadence = ret1num(cadence);
    // console.log('result', cadence, bluetoothCadenceAverage, bluetoothValues.cadence);


    if (bluetoothValues.cadence) {
        console.log('hasCadence...ui update');
        updateChip('na', 3, ret0string(bluetoothValues.cadence) + ' RPM');
        ui('.item-cadence', ret0string(bluetoothValues.cadence) + ' RPM');
    }
    previousCadenceSample = currentCadenceSample;
}

var wheelVals = [1, 2, 3, 4];

function calculateSpeed() {

    if (!previousSample) {
        console.log('no prevSample');
        previousSample = currentSample;
        return;
    }

    wheelVals.push(currentSample.wheel);
    wheelVals.shift();
    // console.log('wheelVals ', JSON.stringify(wheelVals));
    // console.log('calculateSpeed', JSON.stringify(currentSample), JSON.stringify(previousSample));

    sampleWheelTime = diffForSample(currentSample.wheelTime, previousSample.wheelTime, UINT16_MAX);
    sampleWheelRevs = diffForSample(currentSample.wheel, previousSample.wheel, UINT32_MAX);

    // console.log('sampleWheelRevs', sampleWheelRevs, 'sampleWheelTime', sampleWheelTime);

    // if (sampleWheelRevs == 0 || sampleWheelTime == 0) {
    //     console.log('didnt go anywhere, no time passed, return');
    //     previousSample = currentSample;
    //     return;
    // }

    //sampleWheelTime = sampleWheelTime / 1024;  //seconds

    if (sampleWheelRevs > 15 || sampleWheelTime > 15000) {  //1024th
        //console.log('too much time, reset');
        previousSample = currentSample;
        return;
    }
    //IF TOO SMALL, JUST RET, NOT RESET
    if (sampleWheelRevs < 5) {
        //console.log('WAIT FOR A BIGGER SAMPLE');
        if (_.head(wheelVals) == _.last(wheelVals)) {
            ui('.item-speed-bt', 0 + ' MPH');
            updateChip('na', 2, 0 + ' MPH');
        }
        return;
    }

    totalWheelRevs += sampleWheelRevs;
    totalWheelTime += sampleWheelTime;


    bluetoothValues.activeTime = totalWheelTime / 1024;  //seconds
    bluetoothValues.distance = ((totalWheelRevs * tim.timWheelSize) / 1000 / 1000) * 0.62137;   //miles
    sampleDistance = ((sampleWheelRevs * tim.timWheelSize) / 1000 / 1000) * 0.62137; //miles
    bluetoothValues.speedAverage = bluetoothValues.distance / (bluetoothValues.activeTime / 60 / 60);  //mph
    bluetoothValues.speed = sampleDistance / (sampleWheelTime / 1024 / 60 / 60);  //mph
    if ((bluetoothValues.speed) ? bluetoothValues.speed : 0.0);

    // console.log('calcSpeedValues ', sampleWheelTime, sampleWheelRevs, totalWheelTime, totalWheelRevs, sampleDistance);
    // console.log('btval ', JSON.stringify(bluetoothValues));

    previousSample = currentSample;

    if (bluetoothValues.speed) {
        ui('.item-speed-bt', ret1string(bluetoothValues.speed) + ' MPH');
        updateChip('na', 2, ret1string(bluetoothValues.speed) + ' MPH');
    }

    if (bluetoothValues.distance) {
        ui('.item-distance-bt', ret2string(bluetoothValues.distance) + ' MPH');
        $$('.item-distance-bt').text((ret2string(bluetoothValues.distance)) + ' Miles');
    }
    if (bluetoothValues.speedAverage) {
        ui('.item-average-speed-bt', ret1string(bluetoothValues.speedAverage) + ' MPH');
    } //convert to mph

    if (tim.timMode == 'ON') {
        //not using gps
        totals.distance = ret2num(ret2string(bluetoothValues.distance));
        totals.speed = ret1num(ret1string(bluetoothValues.speedAverage));
        $$('.right-main').html(ret2string(bluetoothValues.distance) + ' MILES');

        if (popupGauge) {
            var gauge = app.gauge.get('.my-gauge');
            gauge.update({
                value: (bluetoothValues.speed * 3.75) / 100,
                valueText: ret1string(bluetoothValues.speed),
            });


            if (totals.heartrate < 1) {
                if (popupGauge) {
                    var gauge2 = app.gauge.get('.my-gauge2');
                    gauge2.update({
                        value: (parseFloat(ret1string(bluetoothValues.speedAverage)) * 3.75) / 100,
                        valueText: ret1string(bluetoothValues.speedAverage),
                        labelText: 'AVG MPH',
                    });
                }
            }
        }


    }

    // ui('item-speed-bt',ret1string(bluetoothValues.speed) + ' MPH');
    // ui('item-average-speed-bt', ret1string(bluetoothValues.speedAverage) + ' MPH (AVG)');
    // ui('item-distance-bt', ret2string(bluetoothValues.distance) + ' MPH');


}

// function OLDcalculateStatsOLD() {
//     console.log('calculateStats Start');

//     if (!previousSample) {
//         console.log('!preiousSample');
//         startDistance = currentSample.wheel * tim.timWheelSize / 1000 / 1000; // km
//         previousSample = currentSample;
//         return;
//     }

//     var distance, cadence, speed;
//     if (hasWheel) {
//         console.log('hasWheel');
//         let wheelTimeDiff = diffForSample(currentSample.wheelTime, previousSample.wheelTime, UINT16_MAX);
//         console.log('wheelTimeDiff', wheelTimeDiff);

//         wheelTimeDiff /= 1024; // Convert from fractional seconds (roughly ms) -> full seconds
//         let wheelDiff = diffForSample(currentSample.wheel, previousSample.wheel, UINT32_MAX);
//         console.log('wheelDiff', wheelDiff);


//         var sampleDistance = wheelDiff * tim.timWheelSize / 1000; // distance in meters
//         console.log('sampleDistance', sampleDistance);

//         if (wheelTimeDiff < 10 && sampleDistance > 0 && sampleDistance < 10) {
//             totalWheelTime += wheelTimeDiff;
//             totalWheelRevs += wheelDiff;
//             console.log('totalWheelTime, totalWheelRevs ', totalWheelTime, totalWheelRevs);


//             //speed = (wheelTimeDiff == 0) ? 0 : sampleDistance / totalWheelTime * 3.6; // km/hr
//             speed = (sampleDistance / 1000 * 0.62137) / (wheelTimeDiff / 60 / 60);
//             distance = ((totalWheelRevs * tim.timWheelSize) / 1000 / 1000) * 0.62137;  //mi
//             bluetoothSpeedAverage = distance / (totalWheelTime / 60 / 60) * 0.62137;  //mi/hr
//             console.log('spd, dist, avg ', speed, distance, bluetoothSpeedAverage);

//         }

//     }

//     if (hasCrank) {
//         console.log('hasCrank');

//         let crankTimeDiff = diffForSample(currentSample.crankTime, previousSample.crankTime, UINT16_MAX);
//         crankTimeDiff /= 1024; // Convert from fractional seconds (roughly ms) -> full seconds
//         let crankDiff = diffForSample(currentSample.crank, previousSample.crank, UINT16_MAX);

//         totalCrankRevs += crankDiff;
//         totalCrankTime += crankTimeDiff;

//         cadence = (crankTimeDiff == 0) ? 0 : (60 * crankDiff / crankTimeDiff); // RPM
//         bluetoothCadenceAverage = (60 * totalCrankRevs / totalCrankTime); // RPM
//     }

//     if (bluetoothStats) {
//         console.log('bluetoothStats has a value');

//         bluetoothStats = {
//             cadence: bluetoothStats.cadence * (1 - updateRatio) + cadence * updateRatio,
//             distance: distance,
//             speed: bluetoothStats.speed * (1 - updateRatio) + speed * updateRatio,
//             avgSpeed: bluetoothSpeedAverage,
//             avgCadence: bluetoothCadenceAverage,
//             activeTime: bluetoothSpeedActiveTime
//         };
//         console.log('bluetoothStats1: ' + JSON.stringify(bluetoothStats));

//     } else {
//         bluetoothStats = {
//             cadence: cadence,
//             distance: distance,
//             speed: speed
//         };
//         console.log('bluetoothStats2: ' + JSON.stringify(bluetoothStats));
//     }
//     previousSample = currentSample;
// }
// END BLUETOOTH CALC

//  BLE SIMULATOR

function startBleSimulator() {
    console.log('startBleSimulator');
    var bleSimdata = [
        { "wheel": 574, "wheelTime": 1000 },
        { "wheel": 575, "wheelTime": 2000 },
        { "wheel": 578, "wheelTime": 3000 },
        { "wheel": 580, "wheelTime": 4000 },
        { "wheel": 581, "wheelTime": 5000 },
    ];

    var i;
    var w = 582; var wt = 6000;

    for (i = 0; i < 100; i++) {
        w += 2;
        wt += (1000 + Math.round(Math.random() * 1000));
        bleSimdata.push({ 'wheel': w, 'wheelTime': wt });
    }
    console.log('bleSimdata', JSON.stringify(bleSimdata));


    i = 0;
    //previousSample = {"wheel":574,"wheelTime":43486};
    //currentSample = {"wheel":574,"wheelTime":100};
    setInterval(() => {
        i++;
        currentSample = {};
        currentSample.wheel = bleSimdata[i]["wheel"];
        currentSample.wheelTime = bleSimdata[i]["wheelTime"];
        // console.log('currentSample ', JSON.stringify(currentSample));

        calculateSpeed();
    }, 3000);


}

// LOCATION SIMULATOR
var fakeLat = 40.6644403;
var fakeLon = -73.9712484;
function startLocationSimulator() {
    console.log('locationSimulator');
    startBleSimulator();
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
// var popupHtml = '<div id = "elem-to-center" class="popup center-popup">' +
//     // '<div class="block-header-gauge">SWIPE UP/DOWN TO DISMISS</div>' +
//     '<div class="block text-align-center">' +
//     '<div class="gauge demo-gauge my-gauge"></div>' +
//     '</div>' +
//     '<div class="block-header-gauge"></div>' +
//     '<div class="block text-align-center">' +
//     '<div class="gauge2 demo-gauge2 my-gauge2"></div>' +
//     '</div>' +
//     '<div class="block-footer"></div>' +
//     '</div>';


// Create dynamic Popup
// var dynamicPopup = app.popup.create({
//     content: popupHtml,
//     backdrop: true,
//     closeByBackdropClick: true,
//     swipeToClose: true,
//     // Events
//     on: {
//         open: function (popup) {
//             console.log('Popup open');

//             var gauge = app.gauge.create({
//                 el: '.gauge',
//                 type: 'circle',
//                 value: 0.1,
//                 size: 220,
//                 borderColor: '#ff0000',
//                 borderWidth: 20,
//                 valueText: '0',
//                 valueFontSize: 55,
//                 valueTextColor: '#ff0000',
//                 valueFontWeight: 700,
//                 labelFontSize: 20,
//                 labelText: 'MPH',
//                 // valueText: 'Speed',
//                 on: {
//                     beforeDestroy: function () {
//                         console.log('Gauge will be destroyed')
//                     },
//                 }
//             })



//             var gauge2 = app.gauge.create({
//                 el: '.gauge2',
//                 type: 'circle',
//                 value: 0.1,
//                 size: 220,
//                 borderColor: '#ff0000',
//                 borderWidth: 20,
//                 valueText: '0',
//                 valueFontSize: 55,
//                 valueTextColor: '#ff0000',
//                 valueFontWeight: 700,
//                 labelFontSize: 20,
//                 labelText: 'BPM',
//                 on: {
//                     beforeDestroy: function () {
//                         console.log('Gauge will be destroyed')
//                     }
//                 }
//             })

//         },
//         opened: function (popup) {
//             console.log('Popup opened');
//             popupGauge = true;
//         },
//     }
// });
// // Events also can be assigned on instance later
// dynamicPopup.on('close', function (popup) {
//     console.log('Popup close');
// });
// dynamicPopup.on('closed', function (popup) {
//     popupGauge = false;
//     console.log('Popup closed');
// });

// // Open dynamic popup from menu bars 
// $$('.dynamic-pop').on('click', function () {
//     dynamicPopup.open();
// });

var popupGauge = false;
var popupCounter = 0;

//NOT USING...
// function changePopupContent() {
//     console.log('changePopupContent');
//     if (popupCounter == 0) { popupCounter += 1; return; }
//     popupCounter += 1;
//     var gauge = app.gauge.get('.my-gauge');
//     gauge.destroy();
//     var gauge2 = app.gauge.get('.my-gauge2');
//     gauge2.destroy();
//     $('#elem-to-center').html('<div class="block-header">NEW</div>' +
//         '<div class="block text-align-center">' +
//         '<div> SOMETHING IN THE MIDDLE </div>' +
//         '</div>');
// }



var t2Content = '';
$$('.my-popup-leaderboard').on('popup:opened', function (e) {
    console.log('my-popup-leaderboard popup opened');
    if (arrRounds.length < 1) {
        $('#leaderboardTable tbody tr').remove();
        t2Content = '<tr><td class="label-cell">AWAITING RESULTS</td><td class="numeric-cell"></td><td class="numeric-cell"></td></tr>';
        $('#leaderboardTable').append(t2Content);



    } else {
        
        $('#leaderboardTable tbody tr').remove();
        let v = _.values(arrRounds);
        let arrSpeed = _.orderBy(v, 'a_speedRoundLast', 'desc');

        var e = 1;
        _.forEach(arrSpeed, function (value) {
            // console.log(JSON.stringify(value));
            t2Content = '<tr>' +
                '<td class="label-cell">' + String(value.fb_timName).toUpperCase() + '</td>' +
                '<td class="numeric-cell">' + ret0string(value.a_speedRoundLast) + ' MPH' + '</td>' +
                '<td class="numeric-cell">' + ret0string(value.a_scoreRoundLast) + '%' + '</td>' +
                '</tr>';
                $('#leaderboardTable').append(t2Content);
                e++;
                
        });
    }
    
  });


  //t3

var t3Content = '';
$$('.my-popup-myrounds').on('popup:opened', function (e) {
    console.log('my-popup-myrounds popup opened');
    if (myRounds.length < 1) {
        $('#myroundsTable tbody tr').remove();
        t3Content = '<tr><td class="label-cell">AWAITING RESULTS</td><td class="numeric-cell"></td><td class="numeric-cell"></td><td class="numeric-cell"></td></tr>';
        $('#myroundsTable').append(t3Content);
    } else {
        
        $('#myroundsTable tbody tr').remove();
        // let v = _.values(arrRounds);
        // let arrSpeed = _.orderBy(v, 'a_speedRoundLast', 'desc');
        var e = 1;
        _.forEach(myRounds, function (value) {
            console.log('myRounds:');
            console.log(JSON.stringify(value));
            t3Content = '<tr>' +
                '<td class="label-cell">' + String(value.timer) + '</td>' +
                '<td class="numeric-cell">' + ret0string(value.speed) + ' MPH' + '</td>' +
                '<td class="numeric-cell">' + ret0string(value.heartrate) + ' BPM' + '</td>' +
                '<td class="numeric-cell">' + ret0string(value.score) + '%' + '</td>' +
                '</tr>';
                $('#myroundsTable').append(t3Content);
                e++;
                
        });
    }
    
  });


  var firstOpenDashboard = true;

  $$('.my-popup-dashboard').on('popup:opened', function (e) {
    console.log('my-popup-dashboard popup opened');

    if (firstOpenDashboard == true) {
        var swiper = app.swiper.create('.swiper-container', {
            speed: 400,
            spaceBetween: 100,
            // direction: 'vertical',
            // loop: true,
        
            // If we need pagination
            // pagination: {
            //   el: '.swiper-pagination',
            // },
        
            // Navigation arrows
            navigation: {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            },
        });
    }
    firstOpenDashboard = false;
    popupGauge = true;


    var gauge = app.gauge.create({
        el: '.gauge',
        type: 'circle',
        value: 0.1,
        size: 190,
        borderColor: '#ff0000',
        borderWidth: 15,
        valueText: '0',
        valueFontSize: 45,
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
        size: 190,
        borderColor: '#ff0000',
        borderWidth: 15,
        valueText: '0',
        valueFontSize: 45,
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

    var gauge3 = app.gauge.create({
        el: '.gauge3',
        type: 'semicircle',
        value: 0.1,
        size: 220,
        borderColor: '#ff0000',
        borderWidth: 5,
        valueText: '0',
        valueFontSize: 45,
        valueTextColor: '#ff0000',
        valueFontWeight: 700,
        labelFontSize: 20,
        labelText: 'MPH',
        on: {
            beforeDestroy: function () {
                console.log('Gauge will be destroyed')
            }
        }
    })
    
  });


//TODO:  CHANGE FROM DISTANCE FILTER LOGIC
