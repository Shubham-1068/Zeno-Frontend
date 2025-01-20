import react from "react";
import VCInterface from "./Components/VCInterface";
import VCInterfaceMobileDevices from "./Components/VCInterfaceMobileDevices";
import Navbar from "./Components/Navbar";
import {isMobile} from "react-device-detect";

const App = () => {
  return (
    <div className="h-screen w-screen">
      <Navbar />
      {isMobile ? <VCInterfaceMobileDevices /> : <VCInterface />}
    </div>
  );
};

export default App;
