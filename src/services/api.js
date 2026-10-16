const API_BASE_URL =
    `${import.meta.env.VITE_API_BASE_URL}/api/rooms`;


async function handleResponse(response){

    const rawText=
        await response.text();


    /* =========================
       ERROR RESPONSE
    ========================= */

    if(!response.ok){

        let message=
            "Something went wrong";


        if(rawText){

            try{

                const errorData=
                    JSON.parse(rawText);

                message=
                    errorData.message||
                    errorData.error||
                    message;

            }catch{

                message=
                    rawText;
            }
        }


        throw new Error(
            message
        );
    }


    /* =========================
       EMPTY SUCCESS RESPONSE
    ========================= */

    if(
        response.status===204||
        !rawText.trim()
    ){
        return null;
    }


    /* =========================
       JSON SUCCESS RESPONSE
    ========================= */

    try{

        return JSON.parse(
            rawText
        );

    }catch{

        return rawText;
    }
}


export async function createRoom(data){

    const response=
        await fetch(
            API_BASE_URL,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );

    return handleResponse(
        response
    );
}


export async function joinRoom(
    roomId,
    data
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}/join`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );

    return handleResponse(
        response
    );
}


export async function getRoom(
    roomId
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}`
        );

    return handleResponse(
        response
    );
}


export async function startGame(
    roomId,
    playerId
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}/start`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        playerId
                    })
            }
        );

    return handleResponse(
        response
    );
}


export async function leaveRoom(
    roomId,
    playerId
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}/players/${playerId}`,
            {
                method:"DELETE"
            }
        );

    return handleResponse(
        response
    );
}


export async function selectWord(
    roomId,
    data
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}/select-word`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );

    return handleResponse(
        response
    );
}


export async function getMessages(
    roomId
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}/messages`
        );

    return handleResponse(
        response
    );
}


export async function playAgain(
    roomId,
    playerId
){

    const response=
        await fetch(
            `${API_BASE_URL}/${roomId}/play-again`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        playerId
                    })
            }
        );

    return handleResponse(
        response
    );
}