// let socket = io("https://localhost:4000/");

const socket = io("https://video-chat-hps.herokuapp.com/", {
  withCredentials: true,
});

let $ = (e) => document.querySelector(e);

let videoLoby = $("#video-chat-lobby");
let videoChat = $(".video-chat");
let joinButton = $("#join");
let peerVideo = $("#peer-video");
let userVideo = $("#user-video");
let roomName = $("#roomName");
let creater = false;
let rtcPeerConnection;
let userStream;
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun3.l.google.com:19302" },
    {
      urls: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
    {
      urls: "turn:192.158.29.39:3478?transport=udp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
  ],
};

// let endCall_user;

joinButton.addEventListener("click", () => {
  if (roomName.value === "") alert("Please Enter The Room Name");
  else {
    socket.emit("join", roomName.value);
  }
});

socket.on("created", () => {
  creater = true;
  navigator.mediaDevices
    .getUserMedia({
      audio: { echoCancellation: true },
      video: { facingMode: "user", width: 1280, height: 720 },
    })
    .then((stream) => {
      userStream = stream;
      userVideo.srcObject = stream;
      videoLoby.style = "display: none;";
      videoChat.style = "display:flex";
      userVideo.style = "display:block";
      $(".waiting").style = "display:block";
      userVideo.onloadedmetadata = (e) => {
        userVideo.play();
      };
    })
    .catch((err) => {
      console.log(err);
    });
});
socket.on("joined", () => {
  navigator.mediaDevices
    .getUserMedia({
      audio: { echoCancellation: true },
      video: { facingMode: "user", width: 1280, height: 720 },
    })
    .then((stream) => {
      userStream = stream;
      userVideo.srcObject = stream;
      videoLoby.style = "display: none;";
      videoChat.style = "display:flex";
      userVideo.style = "display:block";
      userVideo.onloadedmetadata = (e) => {
        userVideo.play();
      };

      socket.emit("ready", roomName.value);
    })
    .catch((err) => {
      console.log(err);
    });
});
socket.on("full", () => {
  alert("Room is full cannot join");
});

socket.on("ready", () => {
  console.log("ready client");
  if (creater) {
    console.log("ready creater");
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onTrackFunction;
    $(".endCall").classList.remove("disable");
    console.log(userStream.getTracks()[0]);
    console.log(userStream.getTracks()[1]);
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName.value);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

socket.on("candidate", (candidate) => {
  let iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", (offer) => {
  if (!creater) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName.value);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

socket.on("answer", (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);

  rtcPeerConnection.onconnectionstatechange = (e) => {
    console.log(rtcPeerConnection.connectionState);
    switch (rtcPeerConnection.connectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        console.log("Failed--->", e);
        endCall_user();
        break;
      default:
        console.log("Listening Connection state");
    }
  };
});

let onIceCandidateFunction = (event) => {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName.value);
  }
};

let onTrackFunction = (event) => {
  console.log("peervideo");
  peerVideo.style = "display:block";
  $(".waiting").style = "display:none";
  peerVideo.srcObject = event.streams[0];
  console.log("event-->", event);
  console.log("streams-->", event.streams[0].getTracks());
  console.log(peerVideo.srcObject.getTracks()[1].enabled);
  peerVideo.onloadedmetadata = (e) => {
    peerVideo.play();
  };
  console.log("min--> p", peerVideo.srcObject.getTracks()[0].enabled);
  userVideo.classList.add("user-animate");
};

$(".muteVideo").addEventListener("click", () => {
  userStream.getTracks()[1].enabled = false;
  $(".muteVideo").classList.add("disable");
  $(".unMuteVideo").classList.remove("disable");
  $(".video-btn").classList.add("red");
  $(".video-btn").classList.remove("white");
});

$(".unMuteVideo").addEventListener("click", () => {
  userStream.getTracks()[1].enabled = true;
  $(".unMuteVideo").classList.add("disable");
  $(".muteVideo").classList.remove("disable");
  $(".video-btn").classList.remove("red");
  $(".video-btn").classList.add("white");
});

$(".muteMic").addEventListener("click", () => {
  userStream.getTracks()[0].enabled = false;
  $(".muteMic").classList.add("disable");
  $(".unMuteMic").classList.remove("disable");
  $(".mic-btn").classList.add("red");
  $(".mic-btn").classList.remove("white");
});

$(".unMuteMic").addEventListener("click", () => {
  userStream.getTracks()[0].enabled = true;
  $(".unMuteMic").classList.add("disable");
  $(".muteMic").classList.remove("disable");
  $(".mic-btn").classList.remove("red");
  $(".mic-btn").classList.add("white");
});

$(".endCall").addEventListener("click", () => {
  socket.emit("endCall", roomName.value);

  videoLoby.style = "display: flex;";
  videoChat.style = "display:none";
  userVideo.style = "display:none";
  peerVideo.style = "display:none";

  creater = false;

  if (userVideo.srcObject) {
    userVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
  }
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
    rtcPeerConnection = null;
  }
});

socket.on("endCall", endCall_user);

function endCall_user() {
  peerVideo.style = "display:none";
  $(".waiting").style = "display:block";
  userVideo.classList.remove("user-animate");

  creater = true;

  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
    rtcPeerConnection = null;
  }
}

// Dots
// ====
let dots = $(".dots");

// Function
// ========
function animate(element, className) {
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
    setTimeout(() => {
      animate(element, className);
    }, 500);
  }, 2500);
}

// Execution
// =========

animate(dots, "dots--animate");
