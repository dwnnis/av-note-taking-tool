//    UNMUTE
var unmuteButtonImg = document.getElementById('unmuteButtonImg');

function unmute(){
  if(player.isMuted()) {
    player.unMute();
    unmuteButtonImg.src = "images/icons8-audio-100.png";
  } else {
    player.mute();
    unmuteButtonImg.src = "images/icons8-no-audio-100.png";
  }
}
