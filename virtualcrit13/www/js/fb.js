var database = firebase.database();

function listenRounds() {
  console.log('Listen for Rounds Changes');
  var roundsRef = firebase.database().ref('rounds/' + getTodaysDate());
  roundsRef.on('value', function(snapshot) {
    //console.log('RoundsDB\n'+JSON.stringify(snapshot));
    arrRounds = [];
    snapshot.forEach(function(childSnapshot) {
      var childKey = childSnapshot.key;
      var childData = childSnapshot.val();
      arrRounds.push(childData);
    });
    //console.log('\n\narrRounds:\n', JSON.stringify(arrRounds));
    let v = _.values(arrRounds);

    let arrScore = _.orderBy(v, 'a_scoreRoundLast', 'desc');
    let arrSpeed = _.orderBy(v, 'a_speedRoundLast', 'desc');

    console.log('New Rounds Leader');
    console.log('arrScore[0]', arrScore[0].fb_timName, arrScore[0].a_scoreRoundLast);
    console.log('arrSpeed[0]', arrSpeed[0].fb_timName, arrSpeed[0].a_speedRoundLast); 

  });
  
}

var arrRounds = [];

function listenTotals() {
    console.log('Listen for Totals Changes ' + getTodaysDate());
    //var totalsRef = database.ref('totals/' + getTodaysDate());
    var totalsRef = firebase.database().ref('totals/' + getTodaysDate());
    totalsRef.on('value', function(snapshot) {
        //console.log('TotalsDB\n'+JSON.stringify(snapshot));
        arrTotals = [];
        snapshot.forEach(function(childSnapshot) {
          var childKey = childSnapshot.key;
          var childData = childSnapshot.val();
          
          //console.log('Each Child: ' + JSON.stringify(childSnapshot));
          arrTotals.push(childData);
        });
        
        //console.log('\narrTotals\n' + JSON.stringify(arrTotals));
        
        let i = _.orderBy(arrTotals, ['a_speedTotal'], ['desc']);
        console.log('\ni.name, i.a_speedTotal, ' + i[0].a_speedTotal, i[0].fb_timName),'\n';

        let s = _.orderBy(arrTotals, ['a_scoreHRTotal'], ['desc']);
        console.log('\ni.name, i.a_scoreHRTotal, ' + s[0].a_scoreHRTotal, s[0].fb_timName), '\n';

      });
}



var arrTotals = [];

function postTotals() {
    console.log('postTotals');

    firebase.database().ref('totals/' + getTodaysDate() + '/' + tim.timName + '/').set({
        a_scoreHRTotal: getScoreFromHeartate(totals.heartrate),
        a_scoreHRRoundLast: getScoreFromHeartate(totals.heartrate),
        a_speedTotal: totals.speed,
        a_speedLast: totals.speed,
        a_calcDurationPost: timer.msToTimecode(totalElapsedTime),
        fb_timName: tim.timName,
        fb_timGroup: tim.timGroup,
        fb_timTeam: tim.timTeam,
        fb_Date: getTodaysDate(),
        fb_DateNow: Date.now(),
        fb_timAvgCADtotal: totals.cadence,
        fb_timDistanceTraveled: totals.distance,
        fb_maxHRTotal: tim.timMaxHeartate,
        fb_scoreHRTotal: getScoreFromHeartate(totals.heartrate),
        fb_scoreHRRoundLast: getScoreFromHeartate(totals.heartrate),
        fb_timAvgSPDtotal: totals.speed,
        fb_timLastSPD: totals.speed
    },
    function(error) {
        if (error) {
          console.log('postTotals failed');
          
        } else {
            console.log('postTotals success');
            console.log(JSON.stringify(totals));
        }
      });
}


function postRound() {
    console.log('postRound');

    //TODO  CHANGE THESE VALUES TO PULL FROM LATEST OBJECT STORED IN rounds[]
    firebase.database().ref('rounds/' + getTodaysDate() + '/').push({
        a_scoreRoundLast: getScoreFromHeartate(round.heartrate),
        a_speedRoundLast: round.speed,
        a_calcDurationPost: timer.msToTimecode(totalElapsedTime),
        fb_timName: tim.timName,
        fb_timGroup: tim.timGroup,
        fb_timTeam: tim.timTeam,
        fb_RND: getScoreFromHeartate(round.heartrate),
        fb_Date: getTodaysDate(),
        fb_DateNow: Date.now(),
        fb_SPD: round.speed,
        fb_CAD: round.cadence,
        fb_HR: round.heartrate,
        fb_timDistanceTraveled: totals.distance,
        fb_maxHRTotal: tim.timMaxHeartate,
        fb_timAvgSPDtotal: totals.speed,
        fb_timAvgCADtotal: totals.cadence,
        fb_timAvgHRtotal: totals.heartrate,
        fb_scoreHRTotal: getScoreFromHeartate(totals.heartrate),
        fb_scoreHRRound: getScoreFromHeartate(round.heartrate),
        fb_scoreHRRoundLast: getScoreFromHeartate(round.heartrate),
    },
    function(error) {
        if (error) {
          console.log('postRound failed');
          
        } else {
            console.log('postRound success');
            //console.log(JSON.stringify(round));
            postTotals();
        }
      });
}



function getScoreFromHeartate(hr) {
    return Math.round(totals.heartrate / tim.timMaxHeartate * 100 * 10) / 10;
}