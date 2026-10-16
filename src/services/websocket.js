import {Client} from "@stomp/stompjs";

let stompClient=null;


export function connectWebSocket({
    roomId,
    playerId,
    onRoomUpdate,
    onDrawerUpdate,
    onConnected,
    onDrawing,
    onCanvasEvent,
    onGuessResult,
    onTurnEnd,
    onRoundComplete,
    onDisconnected,
    onError
}) {

    
    if(stompClient?.connected){
        return;
    }

    if(stompClient){

        stompClient.deactivate();

        stompClient=null;
    }


    const client=
        new Client({

             brokerURL: import.meta.env.VITE_WS_URL,

            reconnectDelay:5000,

            heartbeatIncoming:10000,

            heartbeatOutgoing:10000,


            onConnect:()=>{

                console.log(
                    "WebSocket connected"
                );


                /* =========================
                   ROOM UPDATES
                ========================= */

                client.subscribe(
                    `/topic/rooms/${roomId}`,
                    message=>{

                        const updatedRoom=
                            JSON.parse(
                                message.body
                            );

                        console.log(
                            "Room update received:",
                            updatedRoom
                        );

                        if(onRoomUpdate){

                            onRoomUpdate(
                                updatedRoom
                            );
                        }
                    }
                );


                /* =========================
                   PRIVATE DRAWER UPDATE
                ========================= */

                client.subscribe(
                    "/user/queue/drawer",
                    message=>{

                        const drawerUpdate=
                            JSON.parse(
                                message.body
                            );

                        console.log(
                            "Private drawer update:",
                            drawerUpdate
                        );

                        if(onDrawerUpdate){

                            onDrawerUpdate(
                                drawerUpdate
                            );
                        }
                    }
                );


                /* =========================
                   DRAWING
                ========================= */

                client.subscribe(
                    `/topic/rooms/${roomId}/drawing`,
                    message=>{

                        const drawing=
                            JSON.parse(
                                message.body
                            );

                        if(onDrawing){

                            onDrawing(
                                drawing
                            );
                        }
                    }
                );


                /* =========================
                   CANVAS
                ========================= */

                client.subscribe(
                    `/topic/rooms/${roomId}/canvas`,
                    message=>{

                        const event=
                            JSON.parse(
                                message.body
                            );

                        if(onCanvasEvent){

                            onCanvasEvent(
                                event
                            );
                        }
                    }
                );


                /* =========================
                   GUESSES
                ========================= */

                client.subscribe(
                    `/topic/rooms/${roomId}/guesses`,
                    message=>{

                        const result=
                            JSON.parse(
                                message.body
                            );

                        if(onGuessResult){

                            onGuessResult(
                                result
                            );
                        }
                    }
                );


                /* =========================
                   TURN END
                ========================= */

                client.subscribe(
                    `/topic/rooms/${roomId}/turn-end`,
                    message=>{

                        const event=
                            JSON.parse(
                                message.body
                            );

                        console.log(
                            "TURN END RECEIVED:",
                            event
                        );

                        if(onTurnEnd){

                            onTurnEnd(
                                event
                            );
                        }
                    }
                );

                client.subscribe(
    `/topic/rooms/${roomId}/round-complete`,
    message=>{

        const event=
            JSON.parse(
                message.body
            );

        console.log(
            "Round complete:",
            event
        );

        if(onRoundComplete){

            onRoundComplete(
                event
            );
        }
    }
);


                /* =========================
                   REGISTER PLAYER
                ========================= */

                client.publish({

                    destination:
                        "/app/register",

                    body:
                        JSON.stringify({
                            roomId,
                            playerId
                        })
                });


                console.log(
                    "Player connection registered:",
                    roomId,
                    playerId
                );


                if(onConnected){

                    onConnected();
                }
            },


            onDisconnect:()=>{

                console.log(
                    "STOMP disconnected"
                );

                if(onDisconnected){

                    onDisconnected();
                }
            },


            onWebSocketClose:event=>{

                console.log(
                    "WebSocket closed:",
                    event.code,
                    event.reason
                );

                if(onDisconnected){

                    onDisconnected();
                }
            },


            onStompError:frame=>{

                console.error(
                    "STOMP error:",
                    frame.headers,
                    frame.body
                );

                if(onError){

                    onError(frame);
                }
            },


            onWebSocketError:error=>{

                console.error(
                    "WebSocket error:",
                    error
                );

                if(onError){

                    onError(error);
                }
            },


            debug:message=>{

                console.log(
                    "[STOMP]",
                    message
                );
            }
        });


    stompClient=client;

    client.activate();
}


export async function disconnectWebSocket(){

    const client=
        stompClient;

    if(!client){
        return;
    }


    stompClient=null;


    try{

        if(client.active){

            await client.deactivate();

            console.log(
                "WebSocket connection closed"
            );
        }

    }catch(error){

        console.error(
            "Error closing WebSocket:",
            error
        );
    }
}


export function isWebSocketConnected(){

    return Boolean(
        stompClient?.connected
    );
}


export function sendGuess(
    roomId,
    playerId,
    guess
){

    if(!stompClient?.connected){
        return;
    }

    stompClient.publish({

        destination:
            "/app/guess",

        body:
            JSON.stringify({
                roomId,
                playerId,
                guess
            })
    });
}


export function sendDrawing(message){

    if(!stompClient?.connected){
        return;
    }

    stompClient.publish({

        destination:
            "/app/draw",

        body:
            JSON.stringify(
                message
            )
    });
}


export function sendCanvasClear(
    roomId,
    playerId
){

    if(!stompClient?.connected){
        return;
    }

    stompClient.publish({

        destination:
            "/app/clear-canvas",

        body:
            JSON.stringify({
                roomId,
                playerId
            })
    });
}