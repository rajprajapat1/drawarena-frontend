import {useEffect,useRef,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";



import {
    getRoom,
    getMessages,
    leaveRoom,
    startGame
} from "../services/api";

import gameStartSound from "../assets/sounds/game-start.mp3";
import roundStartSound from "../assets/sounds/round-start.mp3";
import gameEndSound from "../assets/sounds/game-end.mp3";

import {
    connectWebSocket,
    disconnectWebSocket
} from "../services/websocket";

import Game from "./Game";
import GameFinished from "./GameFinished";

import avatars from "../data/avatars";

import "../styles/lobby.css";


function RoomPage(){

    const {roomId}=useParams();

    const navigate=useNavigate();


    /* =========================
       STATE
    ========================= */

    const [room,setRoom]=
        useState(null);

    const [error,setError]=
        useState("");

    const [connected,setConnected]=
        useState(false);

    const [countdown,setCountdown]=
        useState(null);

    const [drawerData,setDrawerData]=
        useState(null);

    const [guessResults,setGuessResults]=
        useState([]);

    const [messages,setMessages]=
        useState([]);

    const [drawingEvents,setDrawingEvents]=
        useState([]);

    const [canvasEvent,setCanvasEvent]=
        useState(null);

    const [turnEndEvent,setTurnEndEvent]=
        useState(null);

        const [roundCompleteEvent,setRoundCompleteEvent]=
    useState(null);

    const [successMessage,setSuccessMessage]=
    useState("");

    const [soundEnabled,setSoundEnabled]=
    useState(true);


const previousGameStateRef=
    useRef(null);


const startAudioRef=
    useRef(null);

const roundAudioRef=
    useRef(null);

const endAudioRef=
    useRef(null);

    const startSoundPlayedRef=
    useRef(false);


    const playerId=
        sessionStorage.getItem(
            "playerId"
        );


    /* =========================
       LOAD ROOM
    ========================= */

    useEffect(()=>{

        const loadRoomData=
            async()=>{

                try{

                    const roomResponse=
                        await getRoom(
                            roomId
                        );

                    const messageResponse=
                        await getMessages(
                            roomId
                        );


                    setRoom(
                        roomResponse
                    );

                    setMessages(
                        messageResponse
                    );

                }catch(error){

                    console.error(
                        "Failed to load room:",
                        error
                    );

                    setError(
                        error.message
                    );
                }
            };


        loadRoomData();

    },[
        roomId
    ]);

    /////
    useEffect(()=>{

    if(!successMessage){
        return;
    }

    const timeout=
        setTimeout(
            ()=>{
                setSuccessMessage("");
            },
            2500
        );

    return()=>{
        clearTimeout(timeout);
    };

},[
    successMessage
]);


///////
//////sounds 
useEffect(()=>{

    startAudioRef.current=
        new Audio(gameStartSound);

    roundAudioRef.current=
        new Audio(roundStartSound);

    endAudioRef.current=
        new Audio(gameEndSound);


    startAudioRef.current.volume=0.65;
    roundAudioRef.current.volume=0.65;
    endAudioRef.current.volume=0.7;


    return()=>{

        startAudioRef.current?.pause();
        roundAudioRef.current?.pause();
        endAudioRef.current?.pause();

    };

},[]);

useEffect(()=>{

    if(!room?.gameState){
        return;
    }


    const currentState=
        room.gameState;

    const previousState=
        previousGameStateRef.current;


    /*
     * First room response:
     * remember state without playing anything.
     */
    if(previousState===null){

        previousGameStateRef.current=
            currentState;

        return;
    }


    if(soundEnabled){

        /* =========================
           NEW ROUND
        ========================= */

        if(
            (
                previousState==="ROUND_1"
                &&
                currentState==="ROUND_2"
            )
            ||
            (
                previousState==="ROUND_2"
                &&
                currentState==="ROUND_3"
            )
        ){

            const audio=
                roundAudioRef.current;

            if(audio){

                audio.currentTime=0;

                audio.play()
                    .catch(error=>{

                        console.log(
                            "Round sound blocked:",
                            error
                        );

                    });
            }
        }


        /* =========================
           GAME FINISHED
        ========================= */

        if(
            previousState!=="GAME_FINISHED"
            &&
            currentState==="GAME_FINISHED"
        ){

            const audio=
                endAudioRef.current;

            if(audio){

                audio.currentTime=0;

                audio.play()
                    .catch(error=>{

                        console.log(
                            "End sound blocked:",
                            error
                        );

                    });
            }
        }

    }


    previousGameStateRef.current=
        currentState;

},[
    room?.gameState,
    soundEnabled
]);

useEffect(()=>{

    /*
     * When we are no longer in the
     * starting countdown, prepare this
     * for the next game.
     */
    if(
        room?.gameState!=="STARTING"
    ){

        startSoundPlayedRef.current=
            false;

        return;
    }


    /*
     * Play once when countdown reaches
     * the final 4 seconds.
     */
    if(
        countdown<=1
        &&
        countdown>0
        &&
        !startSoundPlayedRef.current
        &&
        soundEnabled
    ){

        const audio=
            startAudioRef.current;


        if(audio){

            audio.currentTime=0;


            audio.play()
                .catch(error=>{

                    console.log(
                        "Start sound blocked:",
                        error
                    );

                });
        }


        startSoundPlayedRef.current=
            true;
    }

},[
    countdown,
    room?.gameState,
    soundEnabled
]);


    /* =========================
       WEBSOCKET
    ========================= */

    useEffect(()=>{

        const storedPlayerId=
            sessionStorage.getItem(
                "playerId"
            );


        if(!storedPlayerId){
            return;
        }


        connectWebSocket({

            roomId,

            playerId:
                storedPlayerId,


            /* =========================
               ROOM UPDATE
            ========================= */

            onRoomUpdate:
                updatedRoom=>{

                    setRoom(
                        updatedRoom
                    );
                },


            /* =========================
               PRIVATE DRAWER DATA
            ========================= */

            onDrawerUpdate:
                drawerUpdate=>{

                    setDrawerData(
                        drawerUpdate
                    );
                },


            /* =========================
               GUESS RESULT
            ========================= */

            onGuessResult:
                result=>{

                    setGuessResults(
                        previous=>[
                            ...previous,
                            result
                        ]
                    );


                    setMessages(
                        previous=>[
                            ...previous,
                            {
                                playerId:
                                    result.playerId,

                                playerName:
                                    result.playerName,

                                message:
                                    result.correct
                                        ?null
                                        :result.guess,

                                correct:
                                    result.correct,

                                timestamp:
                                    Date.now()
                            }
                        ]
                    );
                },

                


            /* =========================
               DRAWING EVENT
            ========================= */

            onDrawing:
                drawing=>{

                    setDrawingEvents(
                        previous=>[
                            ...previous,
                            drawing
                        ]
                    );
                },


            /* =========================
               CANVAS EVENT
            ========================= */

            onCanvasEvent:
                event=>{

                    setCanvasEvent(
                        event
                    );


                    if(
                        event?.type===
                        "CLEAR"
                    ){

                        setDrawingEvents(
                            []
                        );
                    }
                },

                ////
                onRoundComplete:event=>{

    setRoundCompleteEvent(
        event
    );
},


            /* =========================
               TURN END
            ========================= */

            onTurnEnd:
                event=>{

                    console.log(
                        "Turn end event:",
                        event
                    );


                    setTurnEndEvent(
                        event
                    );
                },


            /* =========================
               CONNECTED
            ========================= */

            onConnected:
                ()=>{

                    setConnected(
                        true
                    );
                },


            /* =========================
               DISCONNECTED
            ========================= */

            onDisconnected:
                ()=>{

                    setConnected(
                        false
                    );
                },


            /* =========================
               ERROR
            ========================= */

            onError:
                error=>{

                    console.error(
                        "Room WebSocket error:",
                        error
                    );
                }
        });


        return()=>{

            disconnectWebSocket();
        };

    },[
        roomId
    ]);


    /* =========================
       START COUNTDOWN
    ========================= */

    useEffect(()=>{

        if(
            !room||
            room.gameState!==
                "STARTING"||
            !room.countdownEndTime
        ){

            setCountdown(
                null
            );

            return;
        }


        const updateCountdown=
            ()=>{

                const remaining=
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                room.countdownEndTime-
                                Date.now()
                            )/1000
                        )
                    );


                setCountdown(
                    remaining
                );
            };


        updateCountdown();


        const interval=
            setInterval(
                updateCountdown,
                250
            );


        return()=>{

            clearInterval(
                interval
            );
        };

    },[
        room?.gameState,
        room?.countdownEndTime
    ]);

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

    /* =========================
       START GAME
    ========================= */

    const handleStartGame=
        async()=>{

            try{

                setError(
                    ""
                );


                await startGame(
                    roomId,
                    playerId
                );
            }catch(error){

                console.error(
                    "Failed to start game:",
                    error
                );
                setError(
                    error.message
                );
            }
        };


    /* =========================
       LEAVE ROOM
    ========================= */

    const handleLeave=
    async()=>{

        try{

            setError("");

            await leaveRoom(
                roomId,
                playerId
            );

            sessionStorage.clear();

            navigate(
                "/",
                {
                    replace:true
                }
            );

        }catch(error){

            console.error(
                "Failed to leave room:",
                error
            );

            setError(
                error.message
            );
        }
    };


    /* =========================
       INVITE
    ========================= */

    const handleInvite=
    async()=>{

        const inviteLink=
            `${window.location.origin}/join/${room.roomId}`;

        try{

            await navigator.clipboard.writeText(
                inviteLink
            );

            setSuccessMessage(
                "Invite link copied!"
            );

        }catch(error){

            console.error(
                "Failed to copy invite link:",
                error
            );

            setError(
                "Could not copy invite link"
            );
        }
    };


    /* =========================
       AVATAR
    ========================= */

    const getAvatarImage=
        avatarId=>{

            return avatars.find(
                avatar=>
                    avatar.id===
                    avatarId
            )?.image;
        };


 



    /* =========================
       LOADING
    ========================= */

    if(!room){

        return(

            <h2>
                Loading room...
            </h2>
        );
    }


    /* =========================
       GAME STATE
    ========================= */

    const isGameActive=
        room.gameState===
            "ROUND_1"||
        room.gameState===
            "ROUND_2"||
        room.gameState===
            "ROUND_3";


    const isGameFinished=
        room.gameState===
        "GAME_FINISHED";


    /* =========================
       GAME FINISHED
    ========================= */

    if(isGameFinished){

        return(

            <GameFinished
                room={
                    room
                }
                onPlayAgain={
                    updatedRoom=>{

                        setRoom(
                            updatedRoom
                        );

                        setDrawerData(
                            null
                        );

                        setGuessResults(
                            []
                        );

                        setMessages(
                            []
                        );

                        setDrawingEvents(
                            []
                        );

                        setCanvasEvent(
                            null
                        );

                        setTurnEndEvent(
                            null
                        );
                    }
                }
            />
        );
    }


    /* =========================
       ACTIVE GAME
    ========================= */

    if(isGameActive){

        return(

            <Game
                    room={room}
                    drawerData={drawerData}
                    onDrawerUpdate={setDrawerData}
                    guessResults={guessResults}
                    messages={messages}
                    drawingEvents={drawingEvents}
                    canvasEvent={canvasEvent}
                    turnEndEvent={turnEndEvent}
                    roundCompleteEvent={roundCompleteEvent}

                    soundEnabled={soundEnabled}
    onToggleSound={()=>
        setSoundEnabled(
            current=>!current
        )
    }
            />
        );
    }


    /* =========================
       LOBBY
    ========================= */

    const isHost=
        playerId===
        room.hostPlayerId;


    return(

        <div className="lobby-page">

            {successMessage&&(

    <div
        className="game-success-toast"
        role="status"
    >

        <div className="game-success-symbol">
            ✓
        </div>

        <div className="game-success-content">

            <span className="game-success-title">
                Nice!
            </span>

            <span className="game-success-message">
                {successMessage}
            </span>

        </div>

        <button
            type="button"
            className="game-success-close"
            onClick={()=>
                setSuccessMessage("")
            }
            aria-label="Close notification"
        >
            ×
        </button>

    </div>

)}

            <div className="lobby-card">

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

                {/* =====================
                    TITLE
                ====================== */}

                <div className="lobby-title-wrap">

                    <h1>
                        DrawArena Lobby
                    </h1>

                    <div className="lobby-title-line">
                    </div>

                </div>


                {/* =====================
                    COUNTDOWN
                ====================== */}

                {room.gameState===
                "STARTING"&&(

                    <div className="countdown-box">

                        <span>
                            Game Starting
                        </span>

                        <strong>
                            {countdown??"..."}
                        </strong>

                    </div>
                )}


                {/* =====================
                    LOBBY MAIN
                ====================== */}

                <div className="lobby-main">


                    {/* =====================
                        PLAYERS
                    ====================== */}

                    <div className="players-panel">


                        <div className="panel-heading">

                            <h3>
                                Players
                            </h3>


                            <div
                                className={
                                    `connection-dot ${
                                        connected
                                            ?"connected"
                                            :"disconnected"
                                    }`
                                }
                            >
                                ●
                            </div>

                        </div>


                        <div className="players-list">


                            {room.players.map(
                                player=>{


                                    const avatarImage=
                                        getAvatarImage(
                                            player.avatar
                                        );


                                    return(

                                        <div
                                            className="player-row"
                                            key={
                                                player.playerId
                                            }
                                        >


                                            {avatarImage&&(

                                                <img
                                                    src={
                                                        avatarImage
                                                    }
                                                    alt={
                                                        player.name
                                                    }
                                                />

                                            )}


                                            <div className="player-info">


                                                <span className="player-name">
                                                    {player.name}
                                                </span>


                                                {player.playerId===
                                                room.hostPlayerId&&(

                                                    <span className="host-badge">
                                                        👑
                                                    </span>

                                                )}


                                            </div>


                                        </div>
                                    );
                                }
                            )}


                        </div>


                    </div>


                    {/* =====================
                        INVITE
                    ====================== */}

                    <div className="invite-center">


                        <button
                            className="invite-button"
                            onClick={
                                handleInvite
                            }
                        >
                            🔗 Invite
                        </button>


                        <span>
                            Copy room link
                        </span>


                    </div>


                    {/* =====================
                        ROOM SETTINGS
                    ====================== */}

                    <div className="room-settings-column">


                        <div className="room-setting-small players-setting">

                            <span>
                                Players
                            </span>

                            <strong>
                                {room.players.length}/{room.maxPlayers}
                            </strong>

                        </div>


                        <div className="room-setting-small time-setting">

                            <span>
                                Duration
                            </span>

                            <strong>
                                {room.drawTimeSeconds}s
                            </strong>

                        </div>


                        <div className="room-setting-small mode-setting">

                            <span>
                                Mode
                            </span>

                            <strong>

                                {
                                    room.gameMode===
                                    "TEAM_BATTLE"
                                        ?"Team Battle"
                                        :"Classic"
                                }

                            </strong>

                        </div>


                    </div>


                    {/* =====================
                        ROOM CODE
                    ====================== */}

                    <div className="room-code-corner">

                        <span>
                            Room
                        </span>

                        <strong>
                            {room.roomId}
                        </strong>

                    </div>


                </div>


                {/* =====================
                    ACTIONS
                ====================== */}

                <div className="lobby-actions">


                    <button
                        className="leave-button"
                        onClick={
                            handleLeave
                        }
                    >
                        Leave Room
                    </button>


                    {!isHost&&
                    room.gameState===
                    "LOBBY"&&(

                        <p className="waiting-text">
                            Waiting for host to start...
                        </p>

                    )}


                    {isHost&&
                    room.gameState===
                    "LOBBY"&&(

                        <button
                            className="start-button"
                            onClick={
                                handleStartGame
                            }
                        >
                            Start Game
                        </button>

                    )}


                </div>


            </div>

        </div>
    );
}


export default RoomPage;