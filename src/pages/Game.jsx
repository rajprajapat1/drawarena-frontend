import {useEffect,useRef,useState} from "react";

import {selectWord} from "../services/api";
import {sendGuess} from "../services/websocket";

import DrawingCanvas from "../components/DrawingCanvas";

import avatars from "../data/avatars";

import "../styles/game.css";


function Game({
    room,
    drawerData,
    onDrawerUpdate,
    messages,
    drawingEvents,
    canvasEvent,
    turnEndEvent,
    roundCompleteEvent,
    soundEnabled,
    onToggleSound
}){

    const playerId=
        sessionStorage.getItem("playerId");


    /* =========================
       STATE
    ========================= */

    const [guess,setGuess]=
        useState("");

    const [timeLeft,setTimeLeft]=
        useState(0);

    const [
        transitionMessage,
        setTransitionMessage
    ]=useState("");

    const [
        wordReveal,
        setWordReveal
    ]=useState("");

    const [roundMessage,setRoundMessage]=useState("");

    const isTeamBattle=room.gameMode==="TEAM_BATTLE";




    /* =========================
       REFS
    ========================= */

    const guessesEndRef=
        useRef(null);

    const previousDrawerRef=
        useRef(
            room.currentDrawerId
        );

    const previousRoundRef=
        useRef(
            room.currentRound
        );

        const previousGameStateRef=
    useRef(room.gameState);




    /* =========================
       ROOM STATE
    ========================= */

    const isDrawer=
        room.currentDrawerId===
        playerId;


    const currentDrawer=
        room.players.find(
            player=>
                player.playerId===
                room.currentDrawerId
        );


    const currentDrawerName=
        currentDrawer?.name||
        "Player";


    const alreadyGuessedCorrectly=
        room.correctGuesserIds?.includes(
            playerId
        );


    const isChoosingWord=
        room.turnPhase===
        "WORD_SELECTION";


    const isDrawing=
        room.turnPhase===
        "DRAWING";


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
       WORD SELECTION
    ========================= */

    const handleSelectWord=
        async word=>{

            try{

                const response=
                    await selectWord(
                        room.roomId,
                        {
                            playerId,
                            word
                        }
                    );


                if(onDrawerUpdate){

                    onDrawerUpdate(
                        response
                    );
                }

            }catch(error){

                console.error(
                    "Word selection failed:",
                    error
                );
            }
        };


    /* =========================
       GUESS
    ========================= */

    const handleGuess=()=>{

        const trimmedGuess=
            guess.trim();


        if(
            !trimmedGuess||
            isDrawer||
            !isDrawing||
            alreadyGuessedCorrectly
        ){
            return;
        }


        sendGuess(
            room.roomId,
            playerId,
            trimmedGuess
        );


        setGuess("");
    };


    /* =========================
       TIMER
    ========================= */

    useEffect(()=>{

        if(
            !isDrawing||
            !room.turnEndTime
        ){

            setTimeLeft(0);

            return;
        }


        const updateTimer=()=>{

            const remaining=
                Math.max(
                    0,
                    Math.ceil(
                        (
                            room.turnEndTime-
                            Date.now()
                        )/1000
                    )
                );


            setTimeLeft(
                remaining
            );
        };


        updateTimer();


        const interval=
            setInterval(
                updateTimer,
                250
            );


        return()=>{

            clearInterval(
                interval
            );
        };

    },[
        isDrawing,
        room.turnEndTime
    ]);

    


    /* =========================
       AUTO SCROLL GUESSES
    ========================= */

    useEffect(()=>{

        guessesEndRef.current
            ?.scrollIntoView({
                behavior:"smooth"
            });

    },[
        messages
    ]);


    /* =========================
       WORD DISPLAY
    ========================= */

    let wordText="";


    if(isChoosingWord){

        wordText=
            isDrawer
                ?"Choose a word"
                :`${currentDrawerName} is choosing a word...`;

    }else if(isDrawing){

        wordText=
            isDrawer
                ?drawerData?.currentWord||
                    "..."
                :room.wordPattern||
                    "...";
    }


    /* =========================
       PLAYER RANKING
    ========================= */

    const rankedPlayers=
        [...room.players]
            .sort(
                (a,b)=>
                    (b.score||0)-
                    (a.score||0)
            );

            const correctGuessCount=
    room.correctGuessCount||0;

const eligibleGuesserCount=
    room.eligibleGuesserCount||0;

const guessProgress=
    eligibleGuesserCount>0
        ?Math.min(
            100,
            (correctGuessCount/eligibleGuesserCount)*100
        )
        :0;

            /////
            ////
            useEffect(()=>{

    if(
        !roundCompleteEvent||
        roundCompleteEvent.type!=="ROUND_COMPLETE"
    ){
        return;
    }

    setWordReveal("");
    setTransitionMessage("");

    if(roundCompleteEvent.round===3){

        setRoundMessage(
            "Game Complete!"
        );

    }else{

        setRoundMessage(
            `Round ${roundCompleteEvent.round} Complete!`
        );
    }

},[
    roundCompleteEvent
]);

    /* =========================
       DRAWER TRANSITION
    ========================= */

    useEffect(()=>{

        const previousDrawer=
            previousDrawerRef.current;


        if(
            previousDrawer&&
            room.currentDrawerId&&
            previousDrawer!==
                room.currentDrawerId
        ){

            const nextDrawer=
                room.players.find(
                    player=>
                        player.playerId===
                        room.currentDrawerId
                );


            if(nextDrawer){

                setTransitionMessage(
                    `${nextDrawer.name}'s turn`
                );
            }
        }


        previousDrawerRef.current=
            room.currentDrawerId;

    },[
        room.currentDrawerId,
        room.players
    ]);


    /* =========================
       ROUND TRANSITION
    ========================= */

    useEffect(()=>{

        const previousRound=
            previousRoundRef.current;


        if(
            previousRound&&
            room.currentRound>
                previousRound
        ){

            setTransitionMessage(
                `Round ${room.currentRound} starting!`
            );
        }


        previousRoundRef.current=
            room.currentRound;

    },[
        room.currentRound
    ]);


    /* =========================
       TRANSITION TIMEOUT
    ========================= */

    useEffect(()=>{

        if(
            !transitionMessage
        ){
            return;
        }


        const timeout=
            setTimeout(
                ()=>{

                    setTransitionMessage(
                        ""
                    );

                },
                1600
            );


        return()=>{

            clearTimeout(
                timeout
            );
        };

    },[
        transitionMessage
    ]);


    /* =========================
       TURN END WORD REVEAL
    ========================= */

    useEffect(()=>{

        if(
            !turnEndEvent||
            turnEndEvent.type!=="TURN_END"||
            !turnEndEvent.word
        ){
            return;
        }

        setTransitionMessage("");


        setWordReveal(
            turnEndEvent.word
        );

    },[
        turnEndEvent
    ]);


    /* =========================
       WORD REVEAL TIMEOUT
    ========================= */

    useEffect(()=>{

        if(
            !wordReveal
        ){
            return;
        }


        const timeout=
            setTimeout(
                ()=>{

                    setWordReveal("");
                },
                1900
            );
        return()=>{

            clearTimeout(
                timeout
            );
        };

    },[
        wordReveal
    ]);

    ////
    useEffect(()=>{

    if(!roundMessage){
        return;
    }

    const timeout=
        setTimeout(
            ()=>{
                setRoundMessage("");
            },
            1900
        );

    return()=>{
        clearTimeout(timeout);
    };

},[
    roundMessage
]);


    /* =========================
       PAGE
    ========================= */

    return(

        <div className="game-page">


            {/* =====================
                WORD REVEAL
            ====================== */}

            {wordReveal&&(

                <div className="word-reveal-overlay">

                    <div className="word-reveal-card">

                        <span className="word-reveal-small">
                            The word was
                        </span>

                        <strong>
                            {wordReveal}
                        </strong>

                    </div>

                </div>
            )}

////
            {roundMessage&&(

                <div className="round-complete-overlay">

                    <div className="round-complete-card">

                        <div className="round-complete-icon">
                            {roundCompleteEvent?.round===3
                                ?"🏆"
                                :"⭐"}
                        </div>

                        <h2>
                            {roundMessage}
                        </h2>

                        {roundCompleteEvent?.round!==3&&(
                            <p>
                                Get ready for the next round!
                            </p>
                        )}

                    </div>

                </div>
            )}


            {/* =====================
                TURN / ROUND TRANSITION
            ====================== */}

            {!wordReveal&&
                !roundMessage&&
                transitionMessage&&(

                <div className="game-transition-overlay">

                    <div className="game-transition-card">

                        <div className="transition-pencil">
                            ✏️
                        </div>

                        <h2>
                            {transitionMessage}
                        </h2>

                    </div>

                </div>
            )}


            {/* =====================
                TOP BAR
            ====================== */}

            <div className="game-topbar">


                <div className="game-brand">


                    <div className="game-logo">

                        <span className="game-logo-draw">
                            Draw
                        </span>

                        <span className="game-logo-arena">
                            Arena
                        </span>

                    </div>


                    <div className="round-badge">

                        <span className="round-label">
                            ROUND
                        </span>

                        <strong>
                            {room.currentRound}/3
                        </strong>

                    </div>


                </div>


                <div className="game-word-center">
                    {wordText}
                </div>

                <button
    type="button"
    className="sound-toggle"
    onClick={onToggleSound}
    title={
        soundEnabled
            ? "Mute sounds"
            : "Enable sounds"
    }
>
    {soundEnabled ? "🔊" : "🔇"}
</button>


                <div className="game-timer-wrap">


                    <span className="timer-label">
                        TIME
                    </span>


                    <div
                        className={
                            `game-timer ${
                                timeLeft<=10&&
                                isDrawing
                                    ?"timer-warning"
                                    :""
                            }`
                        }
                    >

                        {
                            isDrawing
                                ?timeLeft
                                :"--"
                        }

                    </div>


                </div>


            </div>


            {/* =====================
                MAIN GAME
            ====================== */}

            <div className="game-layout">


                {/* =====================
                    PLAYERS
                ====================== */}

                <aside className="players-panel">


                    <div className="game-players-heading">

                        <h3>
                            Players
                        </h3>

                        <span>
                            {room.players.length}
                        </span>

                    </div>

                    {isTeamBattle&&(

    <div className="team-score-board">

        <div className="team-score red-team-score">

            <span>
                RED
            </span>

            <strong>
                {room.redTeamScore||0}
            </strong>

        </div>


        <div className="team-score-divider">
            VS
        </div>


        <div className="team-score blue-team-score">

            <span>
                BLUE
            </span>

            <strong>
                {room.blueTeamScore||0}
            </strong>

        </div>

    </div>

)}


                    <div className="players-list">


                        {rankedPlayers.map(
                            (player,index)=>{


                                const avatarImage=
                                    getAvatarImage(
                                        player.avatar
                                    );


                                const isCurrentDrawer=
                                    player.playerId===
                                    room.currentDrawerId;


                                const hasGuessedCorrectly=
                                    room.correctGuesserIds
                                        ?.includes(
                                            player.playerId
                                        );


                                return(

                                    <div
                                        key={
                                            player.playerId
                                        }
                                        className={
                                            `player-row ${
                                                isCurrentDrawer
                                                    ?"current-drawer"
                                                    :""
                                            } ${
                                                hasGuessedCorrectly
                                                    ?"player-guessed"
                                                    :""
                                            }`
                                        }
                                    >


                                        <span className="player-position">
                                            #{index+1}
                                        </span>


                                        {avatarImage&&(

                                            <img
                                                src={
                                                    avatarImage
                                                }
                                                alt={
                                                    player.name
                                                }
                                                className="game-player-avatar"
                                            />

                                        )}


                                        <div className="game-player-details">

                                            <div className="player-name-line">

    <span className="player-name">
        {player.name}
    </span>

    {player.playerId===playerId&&(
        <span className="you-badge">
            (YOU)
        </span>
    )}

</div>

                                            <div className="player-score-line">

    <span className="player-score">
        {player.score||0} pts
    </span>

    {isTeamBattle&&player.team&&(

        <span
            className={
                `player-team-badge ${
                    player.team==="RED"
                        ?"red-player-team"
                        :"blue-player-team"
                }`
            }
        >
            {player.team}
        </span>

    )}

</div>

                                        </div>


                                        <div className="player-status">


                                            {isCurrentDrawer&&(

                                                <span
                                                    className="drawer-icon"
                                                    title="Drawing"
                                                >
                                                    ✏️
                                                </span>

                                            )}


                                            {!isCurrentDrawer&&
                                            hasGuessedCorrectly&&(

                                                <span
                                                    className="guessed-status"
                                                    title="Guessed correctly"
                                                >
                                                    ✓
                                                </span>

                                            )}


                                        </div>


                                    </div>
                                );
                            }
                        )}


                    </div>


                </aside>


                {/* =====================
                    DRAWING CANVAS
                ====================== */}

                <section className="canvas-panel">


                    <div className="canvas-stage">


                        <DrawingCanvas
                            canDraw={
                                isDrawer&&
                                isDrawing
                            }
                            roomId={
                                room.roomId
                            }
                            playerId={
                                playerId
                            }
                            drawingEvents={
                                drawingEvents
                            }
                            canvasEvent={
                                canvasEvent
                            }
                        />


                        {/* =====================
                            DRAWER WORD SELECTION
                        ====================== */}

                        {isChoosingWord&&
                        isDrawer&&(

                            <div className="word-overlay">

                                <div className="word-selection-card">

                                    <p className="word-selection-label">
                                        Choose a word
                                    </p>


                                    <div className="word-options">


                                        {drawerData
                                            ?.wordChoices
                                            ?.map(
                                                word=>(

                                                    <button
                                                        key={
                                                            word
                                                        }
                                                        type="button"
                                                        className="word-choice-button"
                                                        onClick={
                                                            ()=>
                                                                handleSelectWord(
                                                                    word
                                                                )
                                                        }
                                                    >
                                                        {word}
                                                    </button>

                                                )
                                            )}


                                    </div>


                                    <p className="word-selection-hint">
                                        Pick one quickly and start drawing!
                                    </p>


                                </div>

                            </div>
                        )}


                        {/* =====================
                            OTHER PLAYERS WAIT
                        ====================== */}

                        {isChoosingWord&&
                        !isDrawer&&(

                            <div className="word-overlay viewer-overlay">

                                <div className="choosing-player-card">

                                    <div className="choosing-pencil">
                                        ✏️
                                    </div>

                                    <h2>
                                        {currentDrawerName}
                                    </h2>

                                    <p>
                                        is choosing a word...
                                    </p>


                                    <div className="choosing-dots">

                                        <span></span>
                                        <span></span>
                                        <span></span>

                                    </div>


                                </div>

                            </div>
                        )}


                    </div>


                </section>


                {/* =====================
                    GUESSES
                ====================== */}

                <aside className="guesses-panel">


                    <div className="guesses-heading">

    <h3>
        Guesses
    </h3>

    {isDrawing&&(
        <span className="guess-count">
            {correctGuessCount}/{eligibleGuesserCount}
        </span>
    )}

</div>

{isDrawing&&eligibleGuesserCount>0&&(

    <div className="guess-progress-wrap">

        <div className="guess-progress-track">

            <div
                className="guess-progress-fill"
                style={{
                    width:`${guessProgress}%`
                }}
            />

        </div>

        <span className="guess-progress-text">
            {correctGuessCount===eligibleGuesserCount
                ?"Everyone guessed!"
                :`${correctGuessCount} of ${eligibleGuesserCount} guessed`
            }
        </span>

    </div>

)}

                    <div className="guesses-list">


                        {messages?.map(
                            (message,index)=>{


                                const player=
                                    room.players.find(
                                        player=>
                                            player.playerId===
                                            message.playerId
                                    );


                                const name=
                                    player?.name||
                                    message.playerName||
                                    "Player";


                                return(

                                    <p
                                        key={
                                            `${message.timestamp}-${index}`
                                        }
                                        className={
                                            message.correct
                                                ?"guess-message correct-message"
                                                :"guess-message normal-message"
                                        }
                                    >


                                        {message.correct?(

                                            <>

                                                <strong>
                                                    {name}
                                                </strong>

                                                <span className="correct-text">
                                                    {" "}guessed correctly!
                                                </span>

                                            </>

                                        ):(

                                            <>

                                                <strong>
                                                    {name}
                                                </strong>

                                                <span>
                                                    : {message.message}
                                                </span>

                                            </>

                                        )}


                                    </p>
                                );
                            }
                        )}


                        <div
                            ref={
                                guessesEndRef
                            }
                            className="guesses-end"
                        />


                    </div>


                    {/* =====================
                        GUESS INPUT
                    ====================== */}

                    <div className="guess-input-block">


                        {!isDrawer&&
                        isDrawing&&
                        !alreadyGuessedCorrectly&&(

                            <div className="guess-input-wrap">


                                <input
                                    type="text"
                                    value={
                                        guess
                                    }
                                    placeholder="Type your guess..."
                                    onChange={
                                        event=>
                                            setGuess(
                                                event.target.value
                                            )
                                    }
                                    onKeyDown={
                                        event=>{

                                            if(
                                                event.key===
                                                "Enter"
                                            ){
                                                handleGuess();
                                            }
                                        }
                                    }
                                />


                                <button
                                    type="button"
                                    onClick={
                                        handleGuess
                                    }
                                    aria-label="Send guess"
                                >
                                    ➜
                                </button>


                            </div>
                        )}


                        {!isDrawer&&
                        isDrawing&&
                        alreadyGuessedCorrectly&&(

                            <div className="guessed-correct-state">
                                You guessed correctly!
                            </div>

                        )}


                        {!isDrawer&&
                        isChoosingWord&&(

                            <p className="guess-waiting">
                                Wait until the drawer selects a word
                            </p>

                        )}


                        {isDrawer&&(

                            <p className="guess-waiting">
                                You are drawing
                            </p>

                        )}


                    </div>


                </aside>


            </div>


        </div>
    );
}


export default Game;