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
var timestampButton = document.getElementById("timestampButton");
var unmuteButton = document.getElementById("unmuteButton");
var addElementButton = document.getElementById("addElementButton");

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
timestampButton.addEventListener("click", updatetime);
unmuteButton.addEventListener("click", unmute);
addElementButton.addEventListener("click", addElement);

/*
  Official Example of YouTube iframe API
*/

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: 'BiySUpmBUCo',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    },
    playerVars: {
      playsinline: 0
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
var counter = 0;
function addElement() {
  var newDiv = document.createElement("div");
  var newId = "div".concat(counter.toString());
  newDiv.setAttribute("id", newId);

  var newContent = document.createTextNode("Hi there and greetings!".concat(counter.toString()));
  newDiv.appendChild(newContent);

  var previousDiv = document.getElementById("div".concat((counter-1).toString()));
  if (counter == 0) {
    document.body.insertBefore(newDiv, document.getElementById("note-list"));
  } else if (counter != 0) {
    document.body.insertBefore(newDiv, previousDiv);
  }
  counter += 1;
}

// VOICE RECORDER: 1) pause video 2) record 3)

function startRecording() {
  currentTimestamp = player.getCurrentTime();
  player.pauseVideo();
	console.log("recordButton clicked");

  var constraints = { audio: true, video:false }

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
	au.src = url;

  //button to the timestamp
  navBtn.innerHTML = currentTimestamp.toString();
  navBtn.setAttribute("onclick", "navigateVideoAtTime("+currentTimestamp.toString()+")");

	//save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "Save to disk";

	//add the new audio element to li
	li.appendChild(au);
  li.appendChild(navBtn);
	li.appendChild(document.createTextNode(filename+".wav "))
	li.appendChild(link);
	recordingsList.appendChild(li);

  // after recording done, resume playing video
  player.playVideo();
}
