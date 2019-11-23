var app = new Framework7({
    root: '#app',
    name: 'app',
    id: 'app',

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

var scannedDevices = [];
function postScan() {
    console.log('postScan');
    console.log(JSON.stringify(scannedDevices));

    scannedDevices.forEach(element => {
        console.log(element.id + ", " + element.rssi);
        // $$('.p1').html(element.id);
    });
}

function startup() {
    console.log('startup function');
    scannedDevices = [];
    ble.scan([], 5, function (device) {
        console.log(JSON.stringify(device));
        scannedDevices.push(device);
    }, function (e) {
        console.log('failure, ' + e);
    });

    setTimeout(function () {
        console.log('scan complete, calling postScan');
        postScan();
    },
        5000
    );

    var totalTime = '00:00:00';
    var systemStatus = "Stopped";
    $$('.total-time').text(totalTime);
    $$('.system-status').text(systemStatus);

}



