/*
  Setups
*/

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record


var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
// var timestampButton = document.getElementById("timestampButton");
var unmuteButton = document.getElementById("unmuteButton");
// var addElementButton = document.getElementById("addElementButton");

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
// timestampButton.addEventListener("click", updatetime);
unmuteButton.addEventListener("click", unmute);
// addElementButton.addEventListener("click", addElement);

/*
  Official Example of YouTube iframe API
*/

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.

// take whatever's behind ? (?https://youtu.be/zCrM5jIqQD4)
// https://dwnnis.github.io/av-note-taking-tool/?https://youtu.be/zCrM5jIqQD4
var rawURL = window.location.href.toString();
var pieces = rawURL.split(/[\s/]+/);
var videoID = pieces[pieces.length-1];

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoID,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    },
    playerVars: {
      playsinline: 1
    }
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
    setTimeout(stopVideo, 60000);
    done = true;
  }
}
function stopVideo() {
  player.stopVideo();
}


/*
  Button Calls
*/

// TIMESTAMP: listen to button and change html
var timestamp = document.getElementById("timestampButton");
var currentTimestamp;
function updatetime() {
  currentTimestamp = player.getCurrentTime();
  timestamp.innerHTML = currentTimestamp;
}

// SCREENSHOT: listen to button and take screenshot
function screenshot(){
  html2canvas(document.querySelector(".html5-video-container")).then(canvas => {
    document.body.appendChild(canvas)
  });
}

// NAVIGATE BUTTON: 1) go to certain time 2) pause
function navigateVideoAtTime(timestamp) {
  player.seekTo(timestamp, true);
  player.playVideo();
  player.mute();
}

// UNMUTE
function unmute(){
  player.unMute();
}

// ADD ITEM: add new item
var counter = 1;
function addElement() {
  var newDiv = document.createElement("div");
  var newId = "div".concat(counter.toString());
  newDiv.setAttribute("id", newId);

  var newContent = document.createTextNode("Hi there and greetings!".concat(counter.toString()));
  newDiv.appendChild(newContent);

  var previousDiv = document.getElementById("div".concat((counter-1).toString()));
  if (counter == 1) {
    document.body.insertBefore(newDiv, document.getElementById("note-list"));
  } else if (counter != 1) {
    document.body.insertBefore(newDiv, previousDiv);
  }
  counter += 1;
}

// VOICE RECORDER: 1) pause video 2) record 3)
var constraints = { audio: true, video:false };
function startRecording() {
  currentTimestamp = player.getCurrentTime();
  player.pauseVideo();
	console.log("recordButton clicked");

  recordButton.disabled = true;
	stopButton.disabled = false;

  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

    audioContext = new AudioContext();
    gumStream = stream;
    input = audioContext.createMediaStreamSource(stream);

    rec = new Recorder(input,{numChannels:1});
    rec.record()

    console.log("Recording started");

  }).catch(function(err) {
      //enable the record button if getUserMedia() fails
      console.log("failed start recording");
      console.log(err);
      recordButton.disabled = false;
      stopButton.disabled = true;
  });
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;

	rec.stop();
	gumStream.getAudioTracks()[0].stop();

	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
  var navBtn = document.createElement('button')
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toLocaleString("en-US", {timeZone: "America/Chicago"});

	//add controls to the <audio> element
	au.controls = true;
  au.setAttribute("style", "width: 260px; height: 40px;")
	au.src = url;


  //button to the timestamp
  // navBtn.innerHTML = currentTimestamp.toString();
  navBtn.innerHTML = timeFormatting(currentTimestamp);
  navBtn.setAttribute("class", "btn btn-primary");
  navBtn.setAttribute("onclick", "navigateVideoAtTime("+currentTimestamp.toString()+")");

	//save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = filename;

	//add the new audio element to li
	li.appendChild(au);
  li.appendChild(navBtn);
	li.appendChild(document.createTextNode(filename+".wav "))
	li.appendChild(link);
	// recordingsList.appendChild(li);

  var tr = document.createElement('tr');
  var th = document.createElement('th');
  var btn_td = document.createElement('td');
  var au_td = document.createElement('td');
  var time_td = document.createElement('td');

  th.scope = "row";
  th.innerHTML = counter;
  counter += 1;

  btn_td.appendChild(navBtn);
  au_td.appendChild(au);
  time_td.appendChild(link);

  tr.appendChild(th);
  tr.appendChild(btn_td);
  tr.appendChild(au_td);
  // tr.appendChild(time_td);

  audioNoteList.appendChild(tr);



  // after recording done, resume playing video
  player.playVideo();
}

function timeFormatting(rawSeconds) {
  var min = Math.floor(rawSeconds/60);
  var second = Math.floor(rawSeconds - (60 * min));
  var secondString;
  // second toString
  if (second < 10) {
    secondString = "0" + second.toString();
  } else {
    secondString = second.toString();
  }
  var result = min.toString() + ":" + secondString;
  return result;
}
