import {useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";

import {createRoom} from "../services/api";

import avatars from "../data/avatars";

import "../styles/setup.css";


function CreateRoomForm({onBack}){

    const navigate=useNavigate();

    const [name,setName]=useState("");
    const [maxPlayers,setMaxPlayers]=useState(8);
    const [gameMode,setGameMode]=useState("CLASSIC");
    const [drawTimeSeconds,setDrawTimeSeconds]=useState(60);

    const [selectedAvatar,setSelectedAvatar]=
        useState(avatars[0]);

    const [shuffling,setShuffling]=useState(false);

    const [error,setError]=useState("");

    const [creating,setCreating]=useState(false);


    /* =========================
       AVATAR SHUFFLE
    ========================= */

    const shuffleAvatar=()=>{

        if(shuffling){
            return;
        }

        setShuffling(true);

        let count=0;

        const interval=
            setInterval(()=>{

                setSelectedAvatar(
                    avatars[
                        Math.floor(
                            Math.random()*
                            avatars.length
                        )
                    ]
                );

                count++;


                if(count>=8){

                    clearInterval(
                        interval
                    );

                    setShuffling(
                        false
                    );
                }

            },70);
    };


    /* =========================
       CREATE ROOM
    ========================= */

    const handleCreate=async()=>{

        if(!name.trim()){

            setError(
                "Enter your name"
            );

            return;
        }


        try{

            setCreating(
                true
            );

            setError(
                ""
            );


            const response=
                await createRoom({
                    name:
                        name.trim(),

                    avatar:
                        selectedAvatar.id,

                    maxPlayers,

                    gameMode,

                    drawTimeSeconds
                });


            sessionStorage.setItem(
                "roomId",
                response.roomId
            );

            sessionStorage.setItem(
                "playerId",
                response.playerId
            );

            sessionStorage.setItem(
                "playerName",
                name.trim()
            );

            sessionStorage.setItem(
                "avatar",
                selectedAvatar.id
            );


            navigate(
                `/room/${response.roomId}`
            );

        }catch(error){

            console.error(
                "Create room failed:",
                error
            );

            setError(
                error.message
            );

        }finally{

            setCreating(
                false
            );
        }
    };

    useEffect(()=>{

    if(!error){
        return;
    }

    const timeout=
        setTimeout(()=>{

            setError("");

        },3500);


    return()=>{

        clearTimeout(
            timeout
        );
    };

},[
    error
]);

    return(

        <div className="setup-page">

             {/* =====================
                    ERROR
                ====================== */}

                {error&&(
            <div className="game-error-toast">

                <div className="game-error-symbol">
                    !
                </div>

                <div className="game-error-content">

                    <span className="game-error-title">
                        Oops!
                    </span>

                    <span className="game-error-message">
                        {error}
                    </span>

                </div>

                <button
                    type="button"
                    className="game-error-close"
                    onClick={()=>
                        setError("")
                    }
                    aria-label="Close error"
                >
                    ×
                </button>

            </div>
        )}

            <div className="setup-card">


                {/* =====================
                    BACK
                ====================== */}

                <button
                    type="button"
                    className="setup-back"
                    onClick={onBack}
                >
                    ←
                </button>


                {/* =====================
                    HEADER
                ====================== */}

                <div className="setup-header">

                    <h2>
                        Create a Room
                    </h2>

                    <p className="setup-subtitle">
                        Set up your game and invite your friends
                    </p>

                </div>


               


                {/* =====================
                    FORM
                ====================== */}

                <div className="setup-grid">


                    {/* LEFT */}

                    <div className="setup-module setup-module-left">


                        <div className="setup-field">

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={
                                    event=>
                                        setName(
                                            event.target.value
                                        )
                                }
                                onKeyDown={
                                    event=>{

                                        if(
                                            event.key==="Enter"&&
                                            !creating
                                        ){
                                            handleCreate();
                                        }
                                    }
                                }
                            />

                        </div>


                        <div className="avatar-block">

                            <img
                                src={
                                    selectedAvatar.image
                                }
                                alt="Selected avatar"
                                className="avatar-preview"
                                onClick={
                                    shuffleAvatar
                                }
                            />

                            <button
                                type="button"
                                className="shuffle-button"
                                onClick={
                                    shuffleAvatar
                                }
                                disabled={
                                    shuffling
                                }
                            >
                                {
                                    shuffling
                                        ?"Shuffling..."
                                        :"Shuffle Avatar"
                                }
                            </button>

                        </div>


                    </div>


                    {/* RIGHT */}

                    <div className="setup-module setup-module-right">


                        <div className="setup-field select-field">

                            <select
                                value={maxPlayers}
                                onChange={
                                    event=>
                                        setMaxPlayers(
                                            Number(
                                                event.target.value
                                            )
                                        )
                                }
                            >

                                {
                                    Array.from(
                                        {
                                            length:14
                                        },
                                        (_,index)=>
                                            index+2
                                    ).map(
                                        number=>(

                                            <option
                                                key={
                                                    number
                                                }
                                                value={
                                                    number
                                                }
                                            >
                                                {number}
                                            </option>

                                        )
                                    )
                                }

                            </select>

                            <span className="inside-label">
                                Max Players
                            </span>

                        </div>


                        <div className="setup-field select-field">

                            <select
                                value={gameMode}
                                onChange={
                                    event=>
                                        setGameMode(
                                            event.target.value
                                        )
                                }
                            >

                                <option value="CLASSIC">
                                    Classic
                                </option>

                                <option value="TEAM_BATTLE">
                                    Team Battle
                                </option>

                            </select>

                            <span className="inside-label">
                                Game Mode
                            </span>

                        </div>


                        <div className="setup-field">

                            <label>
                                Drawing Time
                            </label>


                            <div className="time-options">

                                {
                                    [60,80,100,120]
                                        .map(
                                            time=>(

                                                <button
                                                    type="button"
                                                    key={
                                                        time
                                                    }
                                                    className={
                                                        drawTimeSeconds===
                                                        time
                                                            ?"time-active"
                                                            :""
                                                    }
                                                    onClick={()=>
                                                        setDrawTimeSeconds(
                                                            time
                                                        )
                                                    }
                                                >
                                                    {time}s
                                                </button>

                                            )
                                        )
                                }

                            </div>

                        </div>


                    </div>


                </div>


                {/* =====================
                    CREATE BUTTON
                ====================== */}

                <div className="setup-button-row">

                    <button
                        type="button"
                        className="setup-primary"
                        onClick={
                            handleCreate
                        }
                        disabled={
                            creating
                        }
                    >
                        {
                            creating
                                ?"Creating..."
                                :"Create Room"
                        }
                    </button>

                </div>


            </div>

        </div>
    );
}


export default CreateRoomForm;