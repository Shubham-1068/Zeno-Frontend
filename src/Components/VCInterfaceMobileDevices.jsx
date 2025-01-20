import React, { useEffect, useState, useRef } from "react";
import io, { connect } from "socket.io-client";
import {
  Mic,
  MicOff,
  Phone,
  Video,
  VideoOff,
  Users,
  Share,
  Settings,
  ChartAreaIcon,
  MessageSquareCode,
  MessageSquareDashed,
  MessageSquare,
  Cross,
  CrossIcon,
  X,
} from "lucide-react";
import Chatbox from "./ChatBox";
import Logo from "../assets/Logo.png";
import Zeno from "../assets/zenobg.png";
import Start from "../assets/start.png";

const VCscreen = () => {
  const [username, setUsername] = useState("");
  const [allUsers, setAllUsers] = useState({});
  const [caller, setCaller] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const endCallBtnRef = useRef(null);
  const joinBtnRef = useRef(null);
  const connectBtnRef = useRef(null);
  const chatBoxRef = useRef(null);
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

    socket.current.on("pv", (data) => {
      if (data === "true") {
        connectBtnRef.current.style.display = "none";
      }
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
    connectBtnRef.current.style.display = "none";
    socket.current.emit("pv", "true");

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
    <div className="h-screen w-screen bg-[#ffffff] text-white">

      <div
        id="join-btn"
        className="absolute top-0 left-0 z-40 h-screen w-screen hidden items-center bg-[#ffffff]"
      >
        {/* Logo */}
      <div className="absolute top-4 left-4 flex items-center">
        <img src={Logo} alt="logo" className="h-12 w-12 rounded-2xl" />
        <span className="ml-4 text-3xl font-bold">Zeno</span>
      </div>
        <div className="relative h-full w-[100vw] flex flex-col items-center justify-center text-center bg-transparent text-black">
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
            <form
              onSubmit={handleUserSubmit}
              className="flex flex-col w-[90%] h-[90%] justify-around"
            >
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
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

      <div className="relative flex h-screen">
        {/* Main Content */}
        <div className="relative flex flex-col items-center h-[88%] mt-20 px-5 md:px-0">
          {/* Video Grid small screen */}
          <div className="md:hidden flex flex-col gap-3 h-[73vh] relative">
            {/* Remote Video */}
            <div className="relative rounded-2xl overflow-hidden bg-[#ffffff] flex flex-col justify-center items-center h-[95%] border-2 border-[#01aac1]">
              {/* Local Video */}
              <div className="absolute bottom-2 right-2 z-10 rounded-2xl overflow-hidden bg-[#ffffff] flex flex-col justify-center items-center h-[120px] border-2 border-[#01aac1]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              {!remoteVideoRef.current?.srcObject && (
                <span className="text-gray-400 text-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  Waiting for video...
                </span>
              )}
            </div>
          </div>

          {/* Control Bar */}
          <div className="h-[70px] -mt-4 flex items-center justify-center px-4 gap-3">
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
              className="p-4 rounded-full bg-[#01aac1] hover:bg-opacity-80 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <MessageSquare className="w-6 h-6" />
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

        <div
          ref={connectBtnRef}
          className="h-screen w-screen absolute z-20 top-0 left-0 bg-[#0000005b]"
        >
          <div className="w-screen absolute bottom-0 left-0 h-[290px]">
            <div className="w-[90%] h-full mx-auto bg-[#ffffff] border-2 border-[#01aac1] md:flex flex-col rounded-t-xl overflow-y-auto">
              {" "}
              <div className="flex items-center justify-between mb-2 text-white bg-[#01aac1] px-4 py-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants
                </h2>
                <button className="text-sm font-semibold px-3 py-1 rounded-lg bg-white text-black">
                  {Object.keys(allUsers).length} Active
                </button>
              </div>
              {!isJoined && (
                <div className="flex items-center gap-3 mx-auto my-auto text-xl text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
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
                  <div className="w-full px-4">
                    <button
                      key={username}
                      onClick={() => startCall(Object.keys(allUsers).at(-2))}
                      className="p-2 text-lg text-white bg-green-600 hover:bg-green-700 mx-auto w-full rounded-xl"
                    >
                      Connect
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Chatbox Section */}
      {isOpen && (
        <div className="fixed top-0 z-10 left-0 w-screen h-screen bg-[#0000005b] flex items-center justify-center">
          <div
            className="relative mx-auto border-2 border-[#01aac1] h-[58%] w-80 rounded-xl overflow-hidden"
            ref={chatBoxRef}
          >
            <Chatbox username={username} />
            <X
              className="w-8 h-8 absolute z-20 top-2 right-4 cursor-pointer border-2 rounded-full p-1"
              color="white"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VCscreen;
