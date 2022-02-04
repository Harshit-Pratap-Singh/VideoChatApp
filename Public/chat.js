var socket = io.connect('https://192.168.29.21:4000');

var videoLoby = document.querySelector('#video-chat-lobby');
var videoChat = document.querySelector('#video-chat');
var joinButton = document.querySelector('#join');
var peerVideo = document.querySelector('#peer-video');
var userVideo = document.querySelector('#user-video');
var roomName = document.querySelector('#roomName');
var creater=false;
var rtcPeerConnection;
var userStream;
var iceServers={
    iceServers:[
        {urls:'stun:stun.services.mozilla.com'},
        {urls:'stun:stun.l.google.com:19302'},
        {urls:'stun:stun2.l.google.com:19302'},
        {urls:'stun:stun3.l.google.com:19302'},
    ]
}


joinButton.addEventListener('click', () => {
    if (roomName.value === '') alert("Please Enter The Room Name");
    else {
        socket.emit('join', roomName.value);
    }
})

socket.on('created', () => {
    creater=true;
    navigator.mediaDevices.getUserMedia({
        audio: true, video: { width: 1280, height: 720 }
    })
        .then((stream) => {
            userStream=stream;
            videoLoby.style = 'display: none;'
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = (e) => {
                userVideo.play();
            }
        })
        .catch((err) => {
            console.log(err);
        })
})
socket.on('joined', () => {
    navigator.mediaDevices.getUserMedia({
        audio: true, video: { width: 1280, height: 720 }
    })
        .then((stream) => {
            userStream=stream;
            videoLoby.style = 'display: none;'
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = (e) => {
                userVideo.play();
            }
            socket.emit('ready',roomName.value);
        }).catch((err) => {
            console.log(err);
        })
})
socket.on('full', () => {
    alert('Room is full cannot join');
})

socket.on('ready', () => {
    console.log('ready client');
    if(creater){
    console.log('ready creater');

        rtcPeerConnection=new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate=onIceCandidateFunction;
        rtcPeerConnection.ontrack=onTrackFunction;
        console.log(typeof(userStream));
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream);
        rtcPeerConnection.createOffer().then((offer)=>{
         rtcPeerConnection.setLocalDescription(offer)
            socket.emit('offer',offer,roomName.value);
        }).catch((err)=>{
            console.log(err);
        })
    }
})

socket.on('candidate', (candidate) => {
    var  iceCandidate=new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
})

socket.on('offer', (offer) => {
    if(!creater){
        rtcPeerConnection=new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate=onIceCandidateFunction;
        rtcPeerConnection.ontrack=onTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer().then((answer)=>{
        rtcPeerConnection.setLocalDescription(answer)
            socket.emit('answer',answer,roomName.value);
        }).catch((err)=>{
            console.log(err);
        })
    }
})

socket.on('answer', (answer) => {
    rtcPeerConnection.setRemoteDescription(answer);
   
})

var onIceCandidateFunction=(event)=>{
    if(event.candidate){
        socket.emit('candidate', event.candidate,roomName.value);
    }
}

var onTrackFunction=(event)=>{
    console.log('peervideo');
    peerVideo.srcObject=event.streams[0];
    peerVideo.onloadedmetadata=(e)=>{
        peerVideo.play();
    }
}