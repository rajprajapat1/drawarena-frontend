import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Home from "./pages/Home";
import RoomPage from "./pages/RoomPage";
import InviteJoin from "./pages/InviteJoin";


function App() {

    return (

        <BrowserRouter>

            <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/join/:roomId" element={<InviteJoin/>}/>
    <Route path="/room/:roomId" element={<RoomPage/>}/>
</Routes>

        </BrowserRouter>
    );
}

export default App;