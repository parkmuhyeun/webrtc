var conn = new WebSocket('ws://localhost:8080/socket');

conn.onopen = function() {
    console.log("Connected to the signaling server");
    initialize();
};

conn.onmessage = function(msg) {
    console.log("Got message", msg.data);
    var content = JSON.parse(msg.data);
    var data = content.data;
    switch (content.event) {
        case "offer":
            handleOffer(data);
            break;
        case "answer":
            handleAnswer(data);
            break;
        case "candidate":
            handleCandidate(data);
            break;
        default:
            break;
    }
};

function send(message) {
    conn.send(JSON.stringify(message));
}

var peerConnection;
var dataChannel;

function initialize() {
    let configuration = {
        iceServers : [
            {
                "url": "stun:stun.l.google.com:19302"
            }
        ]
    };

    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
            send({
                event: "candidate",
                data: event.candidate
            });
        }
    };

    dataChannel = peerConnection.createDataChannel("dataChannel", {
        reliable: true
    });

    dataChannel.onerror = function (error) {
        console.log("Error:", error);
    };
    dataChannel.onclose = function () {
        console.log("Data channel is closed");
    };

    dataChannel.onmessage = function (event) {
        console.log("message:", event.data);
    };

    peerConnection.ondatachannel = function (event) {
        dataChannel = event.channel;
    };

    let localStream
    navigator.getUserMedia({
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
            },
            aspectRatio: 1.33333
        },
        audio: true
    }, (stream) => {
        localStream = stream
        document.getElementById("user-video").srcObject = localStream
        peerConnection.addStream(localStream)

        peerConnection.onaddstream = (e) => {
            document.getElementById("peer-video").srcObject = e.stream
        }

    }, (error) => {
        console.log(error)
    })

}

function createOffer() {
    peerConnection.createOffer(function (offer) {
        send({
            event: "offer",
            data: offer
        });
        peerConnection.setLocalDescription(offer);
    }, function (error) {
        alert("Error creating an offer");
    });
}

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function handleOffer(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    peerConnection.createAnswer(function (answer) {
        peerConnection.setLocalDescription(answer);
        send({
            event : "answer",
            data : answer
        })
    }, function (error) {
        alert("Error creating an answer");
    });
};

function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("connection established successfully!!");
}

var input = document.getElementById("messageInput");
function sendMessage() {
    dataChannel.send(input.value);
    input.value = "";
}