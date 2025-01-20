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
import Chatbox from "./ChatBox";
import Logo from "../assets/Logo.png";
import Zeno from "../assets/zenobg.png";
import Start from "../assets/start.png";

const VCscreen = () => {
  const [username, setUsername] = useState("");
  const [allUsers, setAllUsers] = useState({});
  const [caller, setCaller] = useState([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const endCallBtnRef = useRef(null);
  const joinBtnRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const socket = useRef(null);
  const localStream = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    setIsJoined(false);

    socket.current = io("https://zeno-backend-442t.onrender.com");
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

  useEffect(() => {
    if (!allUsers[username]) {
      document.getElementById("join-btn").style.display = "flex";
    }
  });

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
      // endCallBtnRef.current.style.display = "none";
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
    if (username.trim() !== "") {
      document.getElementById("join-btn").style.display = "none";
    }

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
    <div className="min-h-screen bg-[#ffffff] text-white">
      <div className="relative flex h-screen">
        {/* Main Content */}
        <div className="relative flex-1 flex flex-col h-[88%] mt-20 px-5 md:px-0">
          {/* Video Grid small screen */}
          <div className="md:hidden flex flex-col gap-3 h-[90%]">
            {/* Local Video */}
            <div className="relative rounded-2xl overflow-hidden bg-[#ffffff] flex flex-col justify-center items-center h-1/2">
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
            <div className="relative rounded-2xl overflow-hidden bg-[#ffffff] flex flex-col justify-center items-center h-1/2">
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
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#01aac1] h-full flex flex-col justify-center items-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                className="w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{"You"}</span>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#01aac1] h-full flex flex-col justify-center items-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              {!remoteVideoRef.current?.srcObject && (
                <span className="text-black text-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  Waiting for another user...
                </span>
              )}
            </div>
          </div>

          {/* Control Bar */}
          <div className="h-20 flex items-center justify-center gap-7 px-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${
                isMuted ? "bg-red-600" : "bg-[#01aac1]"
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
                isVideoOff ? "bg-red-500" : "bg-[#01aac1]"
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

        {/* Right Panel */}
        <div className="mt-[88px] mr-4 w-80">
          {/* Participants Panel */}
        <div className="hidden w-full h-[38%] bg-[#ffffff] border-2 border-[#01aac1] md:flex flex-col rounded-xl overflow-y-auto">
          {" "}
          <div className="flex items-center justify-between mb-2 text-white bg-[#01aac1] px-4 py-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              People on call
            </h2>
            <button className="text-sm font-semibold px-3 py-1 rounded-lg bg-white text-black">
              {Object.keys(allUsers).length} Active
            </button>
          </div>
          {/* user info section */}
          <div
            id="join-btn"
            className="absolute z-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-screen w-screen flex items-center bg-[#ffffff]"
          >
            <div className="relative h-full w-[60vw] flex px-16 justify-between items-center text-center bg-[#01aac1] text-black">
              <div className="flex items-center my-auto">
                <img src={Logo} alt="logo" className="h-[18vw] rounded-xl" />
                {/* <span className="ml-4 text-[50px] font-semibold text-white">Zeno</span> */}
              </div>
              <div className="text-start">
              <h2 className="text-[5vw] font-extrabold text-white">
                ᗯEᒪᑕOᗰE
              </h2>
              <h2 className="text-[5vw] font-extrabold text-white">
                TO
              </h2>
              <h2 className="text-[5vw] font-extrabold text-white">
                ᘔEᑎO
              </h2>
              </div>
            </div>

            <div className="relative h-full w-[40vw] flex flex-col items-center justify-center text-center bg-transparent text-black">
              <div className="absolute h-full w-full top-0 -z-10">
                <img
                  src={Zeno}
                  alt="background"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="h-1/2 w-[70%] max-w-[380px] border-4 border-[#01aac1] bg-slate-200 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
              <p className="text-2xl font-bold flex items-center justify-center">
                <img src={Start} alt="start" className="h-40" />
              </p>
                <form onSubmit={handleUserSubmit} className="flex flex-col w-[90%] h-[90%] justify-around">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-5 py-2 rounded-lg bg-slate-200 text-black text-lg font-semibold border-2 border-[#01aac1] focus:outline-none focus:border-[#01aac1] focus:ring-2 focus:ring-[#01aac1]"
                  />
                  <button
                    type="submit"
                    ref={joinBtnRef}
                    className="w-full py-3 rounded-lg bg-[#01aac1] text-white font-semibold hover:bg-opacity-80 transition-colors"
                    onClick={(e) => setIsJoined(true)}
                  >
                    Join Call
                  </button>
                </form>
              </div>
            </div>
          </div>
          {!isJoined && (
            <div className="flex items-center gap-3 mx-auto my-auto text-xl text-black">
              No User Connected!
            </div>
          )}
          {isJoined && (
            <div className="flex-1 overflow-y-auto text-white w-[90%] mx-auto font-semibold">
              {Object.keys(allUsers).map((user) => (
                <div
                  key={user + Math.random()}
                  className="flex items-center justify-between p-2 rounded-lg mb-2 border-2 bg-[#01aac1] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold">
                      {user[0].toUpperCase()}
                    </div>
                    <span>
                      {user} {user === username ? "(You)" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {Object.keys(allUsers).length >= 2 &&
            username === Object.keys(allUsers).at(-1) && (
              <button
                key={username}
                onClick={() => startCall(Object.keys(allUsers).at(-2))}
                className="p-2 text-lg text-white bg-green-600 hover:bg-green-700"
              >
                {/* <Phone className="w-4 h-4" /> */}
                Connect
              </button>
            )}
        </div>
        <div className="mt-3 border-2 border-[#01aac1] h-[58%] w-80 rounded-xl overflow-hidden">
          <Chatbox username={username} />
        </div>
        </div>
        
      </div>
    </div>
  );
};

export default VCscreen;
