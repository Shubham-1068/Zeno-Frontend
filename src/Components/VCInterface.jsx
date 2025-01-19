import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import {
  Mic,
  MicOff,
  Phone,
  Video,
  VideoOff,
  Users,
  Share,
  Settings,
} from "lucide-react";

const VCscreen = () => {
  const [username, setUsername] = useState("");
  const [allUsers, setAllUsers] = useState({});
  const [caller, setCaller] = useState([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const endCallBtnRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const socket = useRef(null);
  const localStream = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    setIsJoined(false);

    socket.current = io("https://zeno-backend-ptat.onrender.com");
    socket.current.on("connect", () => {
      console.log("Connected to server");
      socket.current.emit("clearUsers", {});
    });

    socket.current.on("allusers", (users) => {
      setAllUsers(users);
    });

    socket.current.on("user-limit-reached", (message) => {
      alert(message); // Notify the user
    });

    socket.current.on("joined", (users) => {
      setAllUsers(users);
    });

    socket.current.on("offer", async ({ from, to, offer }) => {
      const pc = getPeerConnection();
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.current.emit("answer", { from, to, answer: pc.localDescription });
      setCaller([from, to]);
    });

    socket.current.on("answer", async ({ from, to, answer }) => {
      const pc = getPeerConnection();
      await pc.setRemoteDescription(answer);
      endCallBtnRef.current.style.display = "block";
      setCaller([from, to]);
    });

    socket.current.on("icecandidate", async (candidate) => {
      const pc = getPeerConnection();
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.current.on("call-ended", () => {
      endCall();
    });

    startMyVideo();

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const createPeerConnection = () => {
    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };
    const pc = new RTCPeerConnection(config);
    localStream.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.current);
    });
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("icecandidate", event.candidate);
      }
    };
    return pc;
  };

  const getPeerConnection = () => {
    if (
      !peerConnection.current ||
      peerConnection.current.signalingState === "closed"
    ) {
      peerConnection.current = createPeerConnection();
    }
    return peerConnection.current;
  };

  const startCall = async (user) => {
    const pc = getPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.current.emit("offer", {
      from: username,
      to: user,
      offer: pc.localDescription,
    });
  };

  const endCall = () => {
    const pc = getPeerConnection();
    if (pc) {
      pc.close();
      peerConnection.current = null;
      setCaller([]);
      endCallBtnRef.current.style.display = "none";
    }
  };

  const startMyVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      localStream.current = stream;
      localVideoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Permission to access camera and microphone is required.");
    }
  };

  const handleUserSubmit = (e) => {
    document.getElementById("join-btn").style.display = "none";

    e.preventDefault();
    if (username.trim() !== "") {
      socket.current.emit("join-user", username);
    } else {
      alert("Username cannot be empty");
    }
  };

  const handleEndCall = () => {
    socket.current.emit("call-ended", caller);
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="min-h-screen bg-[#070712] text-white">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="relative flex-1 flex flex-col h-[88%] mt-20 px-5 md:px-0">
          {/* Video Grid small screen */}
          <div className="md:hidden flex flex-col gap-3 h-[90%]">
            {/* Local Video */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0c0c22] flex flex-col justify-center items-center h-1/2">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{"You"}</span>
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0c0c22] flex flex-col justify-center items-center h-1/2">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              {!remoteVideoRef.current?.srcObject && (
                <span className="text-gray-400 text-sm">
                  Waiting for video...
                </span>
              )}
            </div>
          </div>

          {/* Video Grid big screen */}
          <div className="hidden flex-1 md:grid grid-cols-2 gap-4 p-2 px-5 h-[90%]">
            <div className="relative rounded-2xl overflow-hidden bg-[#0c0c22] h-full flex flex-col justify-center items-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                className="w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{"You"}</span>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-[#0c0c22] h-full flex flex-col justify-center items-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Control Bar */}
          <div className="h-20 flex items-center justify-center gap-7 px-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${
                isMuted ? "bg-red-500" : "bg-gray-800"
              } hover:bg-opacity-80 transition-colors`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                isVideoOff ? "bg-red-500" : "bg-gray-800"
              } hover:bg-opacity-80 transition-colors`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </button>
            <button
              ref={endCallBtnRef}
              onClick={handleEndCall}
              className="p-4 px-8 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <Phone className="w-6 h-6 rotate-[135deg]" />
            </button>
          </div>
        </div>

        {/* Participants Panel */}
        <div className="hidden mt-20 mr-4 w-80 h-[87%] bg-[#0C0C22] p-4 md:flex flex-col rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              People on call
            </h2>
            <button className="text-sm px-3 py-1 rounded-lg bg-gray-800">
              {Object.keys(allUsers).length} Active
            </button>
          </div>

          <form onSubmit={handleUserSubmit} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-600"
            />
            <button
              type="submit"
              id="join-btn"
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={(e) => setIsJoined(true)}
            >
              Join Call
            </button>
          </form>

          {isJoined && (
            <div className="flex-1 overflow-y-auto mt-3">
              {Object.keys(allUsers).map((user) => (
                <div
                  key={user}
                  className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg mb-2  border-2 border-gray-800 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {user[0].toUpperCase()}
                    </div>
                    <span>
                      {user} {user === username ? "(You)" : ""}
                    </span>
                  </div>
                  {user !== username && (
                    <button
                      onClick={() => startCall(user)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VCscreen;
