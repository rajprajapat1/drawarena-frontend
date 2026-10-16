import {playAgain,leaveRoom} from "../services/api";
import "../styles/gameFinished.css";

function GameFinished({
    room,
    onPlayAgain
}){

    const playerId=
        sessionStorage.getItem(
            "playerId"
        );

    const isHost=
        playerId===
        room.hostPlayerId;

    const isTeamBattle=
        room.gameMode===
        "TEAM_BATTLE";


    const sortedPlayers=
        [...(room.players||[])]
            .sort(
                (a,b)=>
                    (b.score||0)-
                    (a.score||0)
            );


    const winner=
        sortedPlayers[0]||
        null;


    const handlePlayAgain=
        async()=>{

            try{

                const response=
                    await playAgain(
                        room.roomId,
                        playerId
                    );


                if(onPlayAgain){

                    onPlayAgain(
                        response
                    );
                }

            }catch(error){

                console.error(
                    "Play Again failed:",
                    error
                );
            }
        };


    const handleLeave=
        async()=>{

            try{

                await leaveRoom(
                    room.roomId,
                    playerId
                );


                sessionStorage.clear();


                window.location.href="/";

            }catch(error){

                console.error(
                    "Leave failed:",
                    error
                );
            }
        };


    return(

        <div className="finished-page">

            <div className="finished-card">


                {/* =====================
                    HEADER
                ====================== */}

                <div className="finished-header">

                    <div className="finished-trophy">
                        🏆
                    </div>

                    <h1>
                        Game Finished
                    </h1>

                    <p>
                        Final results are here!
                    </p>

                </div>


                {/* =====================
                    CLASSIC WINNER
                ====================== */}

                {!isTeamBattle&&
                winner&&(

                    <div className="winner-card classic-winner">

                        <span className="winner-label">
                            WINNER
                        </span>

                        <h2>
                            🏆 {winner.name}
                        </h2>

                        <strong>
                            {winner.score||0} pts
                        </strong>

                    </div>

                )}


                {/* =====================
                    TEAM BATTLE RESULT
                ====================== */}

                {isTeamBattle&&(

                    <div
                        className={
                            `winner-card ${
                                room.winningTeam==="RED"
                                    ?"red-team-winner"
                                    :room.winningTeam==="BLUE"
                                        ?"blue-team-winner"
                                        :"team-draw"
                            }`
                        }
                    >

                        <span className="winner-label">
                            RESULT
                        </span>

                        <h2>
                            {
                                room.winningTeam
                                    ?`🏆 ${room.winningTeam} Team Wins!`
                                    :"🤝 It's a Draw!"
                            }
                        </h2>

                        <div className="final-team-score">

                            <span>
                                RED {room.redTeamScore||0}
                            </span>

                            <strong>
                                :
                            </strong>

                            <span>
                                BLUE {room.blueTeamScore||0}
                            </span>

                        </div>

                    </div>

                )}


                {/* =====================
                    FINAL LEADERBOARD
                ====================== */}

                <div className="leaderboard-section">

                    <div className="section-title">

                        <span>
                            Final Leaderboard
                        </span>

                    </div>


                    <div className="leaderboard-list">


                        {room.leaderboard?.map(
                            entry=>(

                                <div
                                    key={
                                        entry.playerId
                                    }
                                    className={
                                        `leaderboard-row rank-${entry.rank}`
                                    }
                                >


                                    <div className="rank-box">

                                        {entry.rank===1&&"🥇"}
                                        {entry.rank===2&&"🥈"}
                                        {entry.rank===3&&"🥉"}

                                        {entry.rank>3&&(

                                            <span>
                                                #{entry.rank}
                                            </span>

                                        )}

                                    </div>


                                    <div className="leaderboard-name">
                                        {entry.playerName}
                                    </div>


                                    {isTeamBattle&&(

                                        <span
                                            className={
                                                `final-team-badge ${
                                                    room.players
                                                        ?.find(
                                                            player=>
                                                                player.playerId===
                                                                entry.playerId
                                                        )
                                                        ?.team==="RED"
                                                        ?"final-red"
                                                        :"final-blue"
                                                }`
                                            }
                                        >
                                            {
                                                room.players
                                                    ?.find(
                                                        player=>
                                                            player.playerId===
                                                            entry.playerId
                                                    )
                                                    ?.team||
                                                ""
                                            }
                                        </span>

                                    )}


                                    <div className="leaderboard-score">

                                        {entry.score}

                                        <span>
                                            {" "}pts
                                        </span>

                                    </div>


                                </div>

                            )
                        )}


                    </div>

                </div>


                {/* =====================
                    TEAM SCORE BREAKDOWN
                ====================== */}

                {isTeamBattle&&(

                    <div className="team-score-section">

                        <div className="section-title">

                            <span>
                                Team Scores
                            </span>

                        </div>


                        <div className="team-score-grid">


                            <div className="team-score red-team">

                                <span>
                                    Red Team
                                </span>

                                <strong>
                                    {room.redTeamScore||0}
                                </strong>

                            </div>


                            <div className="team-score blue-team">

                                <span>
                                    Blue Team
                                </span>

                                <strong>
                                    {room.blueTeamScore||0}
                                </strong>

                            </div>


                        </div>

                    </div>

                )}


                {/* =====================
                    WAITING MESSAGE
                ====================== */}

                {!isHost&&(

                    <p className="host-waiting">
                        Waiting for host to start another game...
                    </p>

                )}


                {/* =====================
                    ACTIONS
                ====================== */}

                <div className="finished-actions">


                    <button
                        className="finished-leave"
                        onClick={
                            handleLeave
                        }
                    >
                        Leave Room
                    </button>


                    {isHost&&(

                        <button
                            className="finished-play-again"
                            onClick={
                                handlePlayAgain
                            }
                        >
                            Play Again
                        </button>

                    )}


                </div>


            </div>

        </div>
    );
}

export default GameFinished;