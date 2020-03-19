//
//    Setups
//

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream;    //stream from getUserMedia()
var rec;          //Recorder.js object
var input;        //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

// Buttons
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var unmuteButton = document.getElementById("unmuteButton");
var downloadButton = document.getElementById("downloadButton");
// var timestampButton = document.getElementById("timestampButton");
// var addElementButton = document.getElementById("addElementButton");


// timestampButton.addEventListener("click", updatetime);
// addElementButton.addEventListener("click", addElement);

// IndexedDB Constants
// Add needed constants here.
const table = document.querySelector('#audioNoteList');
var blobToSave;
var currentTimestamp;
var recordTime;
var counter = 1;

// IndexedDB loading
window.onload = function() {
  recordButton.addEventListener("click", startRecording);
  stopButton.addEventListener("click", stopRecording);
  unmuteButton.addEventListener("click", unmute);
  downloadButton.addEventListener("click", testDownloadFunction);

  let request = window.indexedDB.open('ant_db', 1);

  request.onerror = function() {
    console.log('Database failed to open');
  }
  request.onsuccess = function() {
    console.log('Database opened successfully');
    db = request.result;
    displayData();
  }
  request.onupgradeneeded = function(e) {
    let db = e.target.result;

    // Create an objectStore to store our notes in (basically like a single table)
    let objectStore = db.createObjectStore('ant_os', { keyPath: 'id', autoIncrement:true });

    // Define what data items the objectStore will contain
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
    objectStore.createIndex('audio', 'audio', { unique: false });
    objectStore.createIndex('time', 'time', { unique: false });

    console.log('Database setup complete');
  }
  function addData(e) {
    console.log("add Data to DB");
    e.preventDefault();
    let newItem = { timestamp: currentTimestamp, audio: blobToSave, time: recordTime };
    let transaction = db.transaction(['ant_os'], 'readwrite');
    let objectStore = transaction.objectStore('ant_os');
    let request = objectStore.add(newItem);
    request.onsuccess = function() {
      // Clear the form, ready for adding the next entry
      // titleInput.value = '';
      // bodyInput.value = '';
      // TODO: add audio item here.
    };
    transaction.oncomplete = function() {
      console.log('Transaction completed: database modification finished.');

      // update the display of data to show the newly added item, by running displayData() again.
      displayData();
    };
    transaction.onerror = function() {
      console.log('Transaction not opened due to error');
    };
  }
  function displayData() {
    var counter = 1;
    console.log("display Data");
    while (table.firstChild) { // list should be replaced as "tbody"
      table.removeChild(table.firstChild);
    }
    let objectStore = db.transaction('ant_os').objectStore('ant_os');
    objectStore.openCursor().onsuccess = function(e) {
      let cursor = e.target.result;
      if(cursor) {
        // Create a table item
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        var btn_td = document.createElement('td');
        var au_td = document.createElement('td');
        var time_td = document.createElement('td');

        // Create elements
        var au = document.createElement('audio');
        var navBtn = document.createElement('button')
        var link = document.createElement('a');

        var playBtn = document.createElement("button"); // Player call
        var isPlaying = false;
        var playTimestamp;

        tr.appendChild(th);
        tr.appendChild(btn_td);
        tr.appendChild(au_td);
        tr.appendChild(time_td);
        table.appendChild(tr);

        // Append all items to table
        th.scope = "row";
        th.innerHTML = counter;
        counter += 1;
        btn_td.appendChild(navBtn);
        // au_td.appendChild(au);
        au_td.appendChild(playBtn);
        time_td.appendChild(link);

        // Set Content for each elements
        var url = URL.createObjectURL(cursor.value.audio);
        au.controls = false;
        // au.setAttribute("style", "width: 260px; height: 40px;")
        au.src = url;

        au.onplaying = function() {
          playBtn.textContent = "Stop";
	        isPlaying = true;
        };
        au.onpause = function() {
          playBtn.textContent = "Play";
          isPlaying = false;
        };
        playBtn.addEventListener("click", playAudio);
        playBtn.setAttribute("class", "btn btn-primary");
        playBtn.innerHTML = "Play";
        function playAudio() {
          if (isPlaying){
            au.pause();
            au.currentTime = 0;
          } else {
            au.play();
          }
        }

        navBtn.innerHTML = timeFormatting(cursor.value.timestamp); // change timestamp
        navBtn.setAttribute("class", "btn btn-primary");
        playTimestamp = cursor.value.timestamp;
        // navBtn.setAttribute("onclick", "navigateVideoAtTime("+cursor.value.timestamp.toString()+");"+au.play()+";");

        navBtn.addEventListener("click", function(event) {
          navigateVideoAtTime(playTimestamp);
          console.log(playTimestamp);
          au.play();
        });
        // au.play();

        var filename = cursor.value.time;
        link.href = url;
      	link.download = filename+".wav";
      	link.innerHTML = filename;

        // Set id of the data item inside the table
        tr.setAttribute('data-note-id', cursor.value.id);

        // Create a delete button for the item
        const deleteBtn = document.createElement('button');
        tr.appendChild(deleteBtn);
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = deleteItem;

        // Iterate to the next item in the cursor
        cursor.continue();
      } else {
        // Again, if list item is empty, display a 'No notes stored' message
        if(!table.firstChild) {
          let empty_tr = document.createElement('tr');
          let empty_th = document.createElement('tr');
          empty_th.textContent = 'No notes stored.';
          table.appendChild(empty_tr);
          table.appendChild(empty_th);
        }
        console.log('Notes all displayed');
      }
    };
  }
  function deleteItem(e) {
    let noteId = Number(e.target.parentNode.getAttribute('data-note-id'));
    let transaction = db.transaction(['ant_os'], 'readwrite');
    let objectStore = transaction.objectStore('ant_os');
    let request = objectStore.delete(noteId);
    transaction.oncomplete = function() {
      e.target.parentNode.parentNode.removeChild(e.target.parentNode);
      console.log('Note ' + noteId + ' deleted.');
    }
    if(!table.firstChild) {
      let empty_tr = document.createElement('tr');
      let empty_th = document.createElement('tr');
      empty_th.textContent = 'No notes stored.';
      table.appendChild(empty_tr);
      table.appendChild(empty_th);
    }
  }
  // Recording function
  var constraints = { audio: true, video:false };
  function startRecording() {
    currentTimestamp = player.getCurrentTime();
    // recordTime = new Date().toLocaleString("en-US", {timeZone: "America/Chicago"});
    recordTime = dateFormatting();
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
      timeLabelDisplay();

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
    timeLabelDisplay();

  	//disable the stop button, enable the record too allow for new recordings
  	stopButton.disabled = true;
  	recordButton.disabled = false;

  	rec.stop();
  	gumStream.getAudioTracks()[0].stop();

  	// rec.exportWAV(createDownloadLink);
    rec.exportWAV(saveBlob);
  }

  function saveBlob(blob) {
      console.log("saving blob");
      blobToSave = blob;
      addData(event);
      //    after recording done, resume playing video
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

  function testDownloadFunction() {
    var cursorCounter = 1;
    var zip = new JSZip();
    var outputFile;
    let objectStore = db.transaction('ant_os').objectStore('ant_os');
    objectStore.openCursor().onsuccess = function(e) {
      let cursor = e.target.result;
      if(cursor) {
        // go through all files and add them to a zip files
        zip.file(cursor.value.time.toString()+"-"+cursor.value.timestamp.toString()+".wav", cursor.value.audio);
        console.log(cursor.value.time.toString()+cursor.value.timestamp.toString()+" added");
        // then proceed the cursor
        cursorCounter += 1;
        cursor.continue();
      } else {
        if (cursorCounter > 1) {
          zip.generateAsync({type:"blob"}) // TODO: upload the file to our server.
          .then(function(content) {
            saveAs(content, "output"); // see FileSaver.js
          });
          cursorCounter = 1;
          console.log('File Downloaded!');
        } else {
          console.log("No File was found in the storage.")
        }
      }
    }
  }

}


//    LOADING VIDEO MANUALLY
//    (format: https://dwnnis.github.io/av-note-taking-tool/?https://youtu.be/zCrM5jIqQD4)
var rawURL = window.location.href.toString();
var pieces = rawURL.split(/[\s/]+/);
var videoID = pieces[pieces.length-1];

//
//    Official Example of YouTube iframe API
//

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//    This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoID,
    events: {
      'onReady': onPlayerReady
    },
    playerVars: {
      playsinline: 1
    }
  });
}

//    The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

//    The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
// var done = false;
// function onPlayerStateChange(event) {
//     if (event.data == YT.PlayerState.PLAYING && !done) {
//     setTimeout(stopVideo, 60000);
//     done = true;
//   }
// }
function stopVideo() {
  player.stopVideo();
}

//
//  Button Calls
//

//    TIMESTAMP: listen to button and change html
// var timestamp = document.getElementById("timestampButton");
// var currentTimestamp;
// function updatetime() {
//   currentTimestamp = player.getCurrentTime();
//   timestamp.innerHTML = currentTimestamp;
// }

//    SCREENSHOT: listen to button and take screenshot
// function screenshot(){
//   html2canvas(document.querySelector(".html5-video-container")).then(canvas => {
//     document.body.appendChild(canvas)
//   });
// }

//    NAVIGATE BUTTON: 1) go to certain time 2) pause
function navigateVideoAtTime(timestamp) {
  var unmuteButtonImg = document.getElementById('unmuteButtonImg');
  player.seekTo(timestamp, true);
  player.playVideo();
  // unmute();
  player.mute();
  unmuteButtonImg.src = "images/icons8-no-audio-100.png";
}

//    ADD ITEM: add new item
var counter = 1;
// function addElement() {
//   var newDiv = document.createElement("div");
//   var newId = "div".concat(counter.toString());
//   newDiv.setAttribute("id", newId);
//
//   var newContent = document.createTextNode("Hi there and greetings!".concat(counter.toString()));
//   newDiv.appendChild(newContent);
//
//   var previousDiv = document.getElementById("div".concat((counter-1).toString()));
//   if (counter == 1) {
//     document.body.insertBefore(newDiv, document.getElementById("note-list"));
//   } else if (counter != 1) {
//     document.body.insertBefore(newDiv, previousDiv);
//   }
//   counter += 1;
// }

//    VOICE RECORDER: 1) pause video 2) record


function createDownloadLink(blob) {

  	var url = URL.createObjectURL(blob);
    console.log(url);
  	var au = document.createElement('audio');
    var navBtn = document.createElement('button')
  	var li = document.createElement('li');
  	var link = document.createElement('a');

  	//   name of .wav file to use during upload and download (without extendion)
  	// var filename = new Date().toLocaleString("en-US", {timeZone: "America/Chicago"});
    var filename = dateFormatting();

	//   add controls to the <audio> element
	au.controls = true;
  au.setAttribute("style", "width: 260px; height: 40px;")
	au.src = url;


  //    button to the timestamp
  // navBtn.innerHTML = currentTimestamp.toString();
  navBtn.innerHTML = timeFormatting(currentTimestamp);
  navBtn.setAttribute("class", "btn btn-primary");
  navBtn.setAttribute("onclick", "navigateVideoAtTime("+currentTimestamp.toString()+")");

	//   save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = filename;

	//   add the new audio element to li
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
  tr.appendChild(time_td);

  audioNoteList.appendChild(tr);

  //    after recording done, resume playing video
  player.playVideo();
}

function dateFormatting() {
  var now = new Date();
  var dd = now.getDate();
  var mm = now.getMonth()+1;
  var yyyy = now.getFullYear();
  var hh = now.getHours();
  var mn = now.getMinutes();
  var ss = now.getSeconds();
  function format(time) {
    if(time<10) {
      time='0'+time;
    }
    return time;
  }
  now = format(mm)+"-"+format(dd)+"-"+yyyy+"-"+format(hh)+"-"+format(mn)+"-"+format(ss);
  return now;
}

window.addEventListener("orientationchange", function() {
    // Announce the new orientation number
    // alert(window.orientation);
    var targetClass = document.getElementsByTagName("iframe");
    var table = document.getElementsByTagName("table");

    if (window.innerWidth > window.innerHeight) {
      // if horizontal, 1) hide table. 2) contains the button in full screenshot.
      targetClass[0].setAttribute("style", "height:32vh;");
      table[0].style.display = "block";
    } else if (window.innerWidth < window.innerHeight) {
      // if vertical, 1) show table 2) change back to whatever the original is.
      targetClass[0].setAttribute("style", "height:90vh;");
      table[0].style.display = "none";
    }
}, false);


// function testSaveFunction(){
//   var x = document.getElementById("firstName");
//   console.log(x.value);
//   localStorage.setItem("firstname", x.value);
// }
//
// if (typeof(Storage) !== "undefined") {
//   // Store
//   if (localStorage.getItem("firstname") == null) {
//     localStorage.setItem("firstname", "None Defined");
//   } else {
//     // Retrieve
//     document.getElementById("firstName").value = localStorage.getItem("firstname");
//     console.log(localStorage.getItem("firstname"));
//   }
// } else {
//   document.getElementById("firstName").innerHTML = "Sorry, your browser does not support Web Storage...";
// }
