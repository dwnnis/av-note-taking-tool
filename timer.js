// var minutesLabel = document.getElementById("minutes");
// var secondsLabel = document.getElementById("seconds");
var timeLabel = document.getElementById("timeLabel");
var recordButton = document.getElementById("recordButton");
var timeString = "";
var totalSeconds = 0;
var timerRunning;

function timeLabelDisplay() {
  if (recordButton.innerHTML === "🔴Record Note") {
    // recordButton.style.display = "none";
    // timeLabel.style.display = "block";
    timerRunning = setInterval(setTime, 1000);
    totalSeconds = 0;
    recordButton.innerHTML = "00:00";
  } else {
    clearInterval(timerRunning);
    recordButton.innerHTML = "🔴Record Note";
    // timeLabel.style.display = "none";
    // recordButton.style.display = "block";
    return;
  }
}

// function timeLabelDisplay() {
//   if (timeLabel.style.display === "none") {
//     totalSeconds = 0;
//     var timerRunning = setInterval(setTime, 1000);
//     // timeLabel.innerHTML = timeString;
//     // timeLabel.style.display = "block";
//   } else {
//     console.log("BBBBB");
//     clearInterval(timerRunning);
//     totalSeconds = 0;
//     timeLabel.innerHTML = "Record";
//   }
// }

function setTime() {
  console.log(totalSeconds); // TODO: don't know why but this function proceed to run even after clearInteval
  ++totalSeconds;
  // secondsLabel.innerHTML = pad(totalSeconds % 60);
  // minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
  // timeLabel.innerHTML = pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);
  recordButton.innerHTML = pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}
