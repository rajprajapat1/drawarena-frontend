import {useState} from "react";
import CreateRoomForm from "../components/CreateRoomForm";
import JoinRoomForm from "../components/JoinRoomForm";
import "../styles/home.css";
import leftCharacter from "../assets/home/left-character.png";
import rightCharacter from "../assets/home/right-character.png";
import bulb from "../assets/home/bulb.png";

function Home(){
    const [screen,setScreen]=useState("HOME");
    const [roomCode,setRoomCode]=useState("");

    const openJoin=()=>{
        const code=roomCode.trim().toUpperCase();
        if(!code)return;

        setRoomCode(code);
        setScreen("JOIN");
    };

    if(screen==="CREATE"){
        return(
            <CreateRoomForm
                onBack={()=>setScreen("HOME")}
            />
        );
    }

    if(screen==="JOIN"){
        return(
            <JoinRoomForm
                roomId={roomCode}
                onBack={()=>setScreen("HOME")}
            />
        );
    }

   return(
    <div className="home-page">
        <div className="home-stage">
            <img src={bulb} className="home-bulb" alt=""/>

            <div className="home-decoration yellow-scribble">〰</div>
            <div className="home-decoration blue-scribble">〰</div>
            <div className="home-decoration pink-marks">!!</div>
            <div className="home-decoration mini-crown">♛</div>

            <img
                src={leftCharacter}
                className="home-character home-character-left"
                alt=""
            />

            <img
                src={rightCharacter}
                className="home-character home-character-right"
                alt=""
            />

            <main className="home-content">
                <div className="home-crown">
                    <svg viewBox="0 0 64 48">
                        <path d="M8 38L4 13l16 11L32 5l12 19 16-11-4 25H8Z"/>
                        <path d="M10 42h44"/>
                    </svg>
                </div>

                <h1 className="home-title">
                    <span>Draw</span><span>Arena</span>
                </h1>

                <div className="title-stroke"></div>

                <p className="home-tagline">
                    Draw. Guess. Have Fun!
                </p>

                <button
                    type="button"
                    className="create-room-button"
                    onClick={()=>setScreen("CREATE")}
                >
                    <span className="plus-icon">+</span>
                    Create a Room
                </button>

                <div className="home-divider">
                    <span></span>
                    <small>or</small>
                    <span></span>
                </div>

                <div className="join-row">
                    <span className="link-icon">⌁</span>

                    <input
                        type="text"
                        placeholder="Enter room code"
                        value={roomCode}
                        onChange={e=>setRoomCode(e.target.value)}
                        onKeyDown={e=>{
                            if(e.key==="Enter")openJoin();
                        }}
                    />

                    <button type="button" onClick={openJoin}>
                        →
                    </button>
                </div>
            </main>
        </div>
    </div>
);
}

export default Home;