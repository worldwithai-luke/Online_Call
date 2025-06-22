const videoGrid = document.getElementById("video-grid");

const peer = new Peer({
  config: {
    iceServers: [
      { url: "stun:stun.l.google.com:19302" },
      { url: "stun:stun1.l.google.com:19302" },
      { url: "stun:stun2.l.google.com:19302" },
    ],
  } /* Some google's free stun server and it is fast! */,
});

var myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

peer.on("open", (id) => {
  socketio.emit("join-room", callID, nameData, id);
});
// socketio.emit('join-room', callID, peerid from stun server)

let streamControl;
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({
      video: {
        frameRate: {
          min: 10,
          ideal: 25,
          max: 35,
        },

        width: {
          min: 700,
          ideal: 900,
          max: 1500,
        },
        aspectRatio: 1.33333,
      },
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 44100,
      },
    })
    .then(function(stream) {
      streamControl = stream;

      addVideoStream(myVideo, streamControl);
      peer.on("call", (call) => {
        call.answer(streamControl);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
        call.on("close", () => {
          video.remove();
        });
      });

      socketio.on("connected-user", (msg) => {
        connectToNewUser(msg.id, streamControl);
      });
      socketio.on("disconnect-user", (msg) => {
        console.log(msg.user);
        if (peers[msg.id]) peers[msg.id].close();
        // retryConnectOnFailure(RETRY_INTERVAL);
      });
    })
    .catch(function(error) {
      alert(error);
      console.log("Something went wrong!");
    });
}
function connectToNewUser(userid, streamControl) {
  const call = peer.call(userid, streamControl);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userid] = call;
}

function addVideoStream(video, streamControl) {
  video.srcObject = streamControl;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  var random = Math.floor(Math.random() * 100000);
  video.className = "videoElement";
  video.id = random;
  
  // Create video container for resizing
  const videoContainer = document.createElement("div");
  videoContainer.className = "videoElement";
  videoContainer.id = "container_" + random;
  
  // Create resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";
  
  // Add video to container
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "cover";
  videoContainer.appendChild(video);
  videoContainer.appendChild(resizeHandle);
  
  // Add resize functionality
  makeResizable(videoContainer);
  
  videoGrid.append(videoContainer);
}

function makeResizable(element) {
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  const resizeHandle = element.querySelector('.resize-handle');
  
  resizeHandle.addEventListener('mousedown', initResize);
  
  function initResize(e) {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    element.classList.add('resizing');
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  }
  
  function doResize(e) {
    if (!isResizing) return;
    const newWidth = startWidth + e.clientX - startX;
    const newHeight = startHeight + e.clientY - startY;
    
    // Set minimum and maximum sizes
    const minWidth = 150;
    const minHeight = 100;
    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.7;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      element.style.width = newWidth + 'px';
    }
    if (newHeight >= minHeight && newHeight <= maxHeight) {
      element.style.height = newHeight + 'px';
    }
  }
  
  function stopResize() {
    isResizing = false;
    element.classList.remove('resizing');
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
  }
  
  // Double-click to reset size
  element.addEventListener('dblclick', function() {
    element.style.width = '24%';
    element.style.height = 'auto';
  });
}

let isAudio = true;
function muteAudio() {
  if (streamControl != null && streamControl.getAudioTracks().length > 0) {
    isAudio = !isAudio;
    streamControl.getAudioTracks()[0].enabled = isAudio;
    if (isAudio === false) {
      document.getElementById("microphone").style.backgroundColor =
        "rgb(255, 101, 101)";
    } else {
      document.getElementById("microphone").style.backgroundColor = "white";
    }
  }
}

let isVideo = true;
function muteVideo() {
  if (streamControl != null && streamControl.getVideoTracks().length > 0) {
    isVideo = !isVideo;
    streamControl.getVideoTracks()[0].enabled = isVideo;
    if (isVideo === false) {
      document.getElementById("videoMute").style.backgroundColor =
        "rgb(255, 101, 101)";
    } else {
      document.getElementById("videoMute").style.backgroundColor = "white";
    }
  }
}

let isScreenShare = false;
async function startCapture() {
  isScreenShare = !isScreenShare;
  await navigator.mediaDevices
    .getDisplayMedia({
      cursor: true,
    })
    .then(function(stream) {
      streamControl = stream;
      const video = document.createElement("video");
      video.className = "sc_capture";
      addVideoStream(video, stream);
      stream.onended = () => {
        var shareVideo = document.getElementsByName("sc_capture");
        video.remove();
        console.info("Recording has ended");
        alert("This capture uable to see your friends!");
      };
    });
}
