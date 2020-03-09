var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'BiySUpmBUCo',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
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

// TIMESTAMP: listen to button and change html
var timestamp = document.getElementById("timestamp");
function updatetime() {
  timestamp.innerHTML = player.getCurrentTime();
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
  player.pauseVideo();
}

// VOICE RECORDER: 1) pause video 2) record 3)
