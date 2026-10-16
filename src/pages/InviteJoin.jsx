import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";

import {joinRoom} from "../services/api";
import avatars from "../data/avatars";

import "../styles/join.css";
import "../styles/setup.css";


function InviteJoin(){

    const {roomId}=useParams();
    const navigate=useNavigate();

    const [name,setName]=useState("");
    const [selectedAvatar,setSelectedAvatar]=useState(avatars[0]);
    const [shuffling,setShuffling]=useState(false);
    const [joining,setJoining]=useState(false);
    const [error,setError]=useState("");


    /* =========================
       AUTO HIDE ERROR
    ========================= */

    useEffect(()=>{

        if(!error){
            return;
        }

        const timeout=
            setTimeout(
                ()=>{
                    setError("");
                },
                3500
            );

        return()=>{
            clearTimeout(timeout);
        };

    },[
        error
    ]);


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

                    clearInterval(interval);

                    setShuffling(false);
                }

            },70);
    };


    /* =========================
       JOIN ROOM
    ========================= */

    const handleJoin=async()=>{

        if(joining){
            return;
        }

        if(!name.trim()){

            setError(
                "Enter your name"
            );

            return;
        }

        try{

            setJoining(true);

            setError("");

            const response=
                await joinRoom(
                    roomId,
                    {
                        name:name.trim(),
                        avatar:selectedAvatar.id
                    }
                );

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
                "Join room failed:",
                error
            );

            setError(
                error.message||
                "Unable to join room"
            );

        }finally{

            setJoining(false);
        }
    };


    return(

        <div className="join-setup-page">


            {/* FLOATING ERROR */}

            {error&&(

                <div
                    className="game-error-toast"
                    role="alert"
                >

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


            <div className="join-setup-card">


                <div className="join-header">

                    <h2>
                        Join DrawArena
                    </h2>

                    <p>
                        Room: {roomId}
                    </p>

                </div>


                <div className="join-content">


                    <div className="join-name-block">

                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={
                                e=>
                                    setName(
                                        e.target.value
                                    )
                            }
                            onKeyDown={
                                e=>{

                                    if(
                                        e.key==="Enter"&&
                                        !joining
                                    ){
                                        handleJoin();
                                    }
                                }
                            }
                        />

                    </div>


                    <div className="join-avatar-block">

                        <img
                            src={selectedAvatar.image}
                            alt="Selected avatar"
                            className="join-avatar-preview"
                            onClick={shuffleAvatar}
                        />

                        <button
                            type="button"
                            className="shuffle-button"
                            onClick={shuffleAvatar}
                            disabled={shuffling}
                        >
                            {
                                shuffling
                                    ?"Shuffling..."
                                    :"Shuffle Avatar"
                            }
                        </button>

                    </div>


                </div>


                <button
                    type="button"
                    className="join-primary"
                    onClick={handleJoin}
                    disabled={joining}
                >
                    {
                        joining
                            ?"Joining..."
                            :"Join Room"
                    }
                </button>


            </div>

        </div>
    );
}


export default InviteJoin;