import {useEffect,useRef,useState} from "react";

import {
    sendDrawing,
    sendCanvasClear
} from "../services/websocket";

import "../styles/drawingCanvas.css";


function DrawingCanvas({
    canDraw,
    roomId,
    playerId,
    drawingEvents=[],
    canvasEvent
}){

    const canvasRef=
        useRef(null);

    const drawingRef=
        useRef(false);

    const lastPointRef=
        useRef(null);

    const processedEventsRef=
        useRef(0);


    const [color,setColor]=
        useState("#000000");

    const [brushSize,setBrushSize]=
        useState(4);

    const [tool,setTool]=
        useState("brush");


    const colors=[
        "#000000",
        "#ffffff",
        "#c9c9c9",
        "#7f7f7f",
        "#ff0000",
        "#ff7f00",
        "#ffd400",
        "#00c853",
        "#00b0ff",
        "#0057ff",
        "#7c1fff",
        "#ff4fa3",
        "#8d5a3b",
        "#f4c28b"
    ];


    /* =========================
       POINTER POSITION
    ========================= */

    const getPoint=e=>{

        const canvas=
            canvasRef.current;

        if(!canvas){

            return{
                x:0,
                y:0
            };
        }


        const rect=
            canvas.getBoundingClientRect();


        const scaleX=
            canvas.width/
            rect.width;

        const scaleY=
            canvas.height/
            rect.height;


        return{
            x:
                (
                    e.clientX-
                    rect.left
                )*
                scaleX,

            y:
                (
                    e.clientY-
                    rect.top
                )*
                scaleY
        };
    };


    /* =========================
       HEX -> RGBA
    ========================= */

    const hexToRgba=
        hex=>{

            let value=
                hex.replace(
                    "#",
                    ""
                );


            if(value.length===3){

                value=
                    value
                        .split("")
                        .map(
                            char=>
                                char+char
                        )
                        .join("");
            }


            const number=
                parseInt(
                    value,
                    16
                );


            return[
                (number>>16)&255,
                (number>>8)&255,
                number&255,
                255
            ];
        };


    /* =========================
       COLOR COMPARISON
    ========================= */

    const colorsMatch=(
        data,
        index,
        target
    )=>{

        return(
            data[index]===
                target[0]
            &&
            data[index+1]===
                target[1]
            &&
            data[index+2]===
                target[2]
            &&
            data[index+3]===
                target[3]
        );
    };


    /* =========================
       FLOOD FILL
    ========================= */

    const floodFill=(
        canvas,
        startX,
        startY,
        fillColor
    )=>{

        if(!canvas){
            return;
        }


        const ctx=
            canvas.getContext(
                "2d",
                {
                    willReadFrequently:true
                }
            );


        const width=
            canvas.width;

        const height=
            canvas.height;


        const x=
            Math.floor(
                startX
            );

        const y=
            Math.floor(
                startY
            );


        if(
            x<0||
            y<0||
            x>=width||
            y>=height
        ){
            return;
        }


        const imageData=
            ctx.getImageData(
                0,
                0,
                width,
                height
            );


        const data=
            imageData.data;


        const startIndex=
            (
                y*
                width+
                x
            )*
            4;


        const targetColor=[
            data[startIndex],
            data[startIndex+1],
            data[startIndex+2],
            data[startIndex+3]
        ];


        const replacementColor=
            hexToRgba(
                fillColor
            );


        /*
         * Clicking an area that already
         * has this exact color does nothing.
         */
        if(
            targetColor[0]===
                replacementColor[0]
            &&
            targetColor[1]===
                replacementColor[1]
            &&
            targetColor[2]===
                replacementColor[2]
            &&
            targetColor[3]===
                replacementColor[3]
        ){
            return;
        }


        const visited=
            new Uint8Array(
                width*
                height
            );


        const stack=[
            [
                x,
                y
            ]
        ];


        while(stack.length>0){

            const[
                currentX,
                currentY
            ]=
                stack.pop();


            if(
                currentX<0||
                currentY<0||
                currentX>=width||
                currentY>=height
            ){
                continue;
            }


            const pixelPosition=
                currentY*
                width+
                currentX;


            if(
                visited[
                    pixelPosition
                ]
            ){
                continue;
            }


            visited[
                pixelPosition
            ]=1;


            const index=
                pixelPosition*
                4;


            if(
                !colorsMatch(
                    data,
                    index,
                    targetColor
                )
            ){
                continue;
            }


            data[index]=
                replacementColor[0];

            data[index+1]=
                replacementColor[1];

            data[index+2]=
                replacementColor[2];

            data[index+3]=
                replacementColor[3];


            stack.push(
                [
                    currentX+1,
                    currentY
                ],

                [
                    currentX-1,
                    currentY
                ],

                [
                    currentX,
                    currentY+1
                ],

                [
                    currentX,
                    currentY-1
                ]
            );
        }


        ctx.putImageData(
            imageData,
            0,
            0
        );
    };


    /* =========================
       START DRAWING / FILL
    ========================= */

    const startDrawing=e=>{

        if(!canDraw){
            return;
        }


        e.preventDefault();


        const canvas=
            canvasRef.current;

        if(!canvas){
            return;
        }


        const point=
            getPoint(e);


        /* =====================
           BUCKET
        ====================== */

        if(tool==="bucket"){

            floodFill(
                canvas,
                point.x,
                point.y,
                color
            );


            sendDrawing({
                roomId,
                playerId,

                type:"FILL",

                x:
                    point.x/
                    canvas.width,

                y:
                    point.y/
                    canvas.height,

                previousX:0,
                previousY:0,

                color,

                brushSize:1
            });


            return;
        }


        /* =====================
           BRUSH / ERASER
        ====================== */

        drawingRef.current=
            true;


        lastPointRef.current=
            point;


        if(
            e.currentTarget
                .setPointerCapture
        ){

            e.currentTarget
                .setPointerCapture(
                    e.pointerId
                );
        }
    };


    /* =========================
       DRAW
    ========================= */

    const draw=e=>{

        if(
            !canDraw||
            !drawingRef.current||
            tool==="bucket"
        ){
            return;
        }


        e.preventDefault();


        const canvas=
            canvasRef.current;


        const ctx=
            canvas.getContext(
                "2d"
            );


        const current=
            getPoint(e);


        const previous=
            lastPointRef.current;


        if(!previous){
            return;
        }


        ctx.beginPath();

        ctx.moveTo(
            previous.x,
            previous.y
        );

        ctx.lineTo(
            current.x,
            current.y
        );


        ctx.lineWidth=
            brushSize;

        ctx.lineCap=
            "round";

        ctx.lineJoin=
            "round";


        if(tool==="eraser"){

            ctx.globalCompositeOperation=
                "destination-out";

        }else{

            ctx.globalCompositeOperation=
                "source-over";

            ctx.strokeStyle=
                color;
        }


        ctx.stroke();


        sendDrawing({
            roomId,
            playerId,

            type:"STROKE",

            x:
                current.x/
                canvas.width,

            y:
                current.y/
                canvas.height,

            previousX:
                previous.x/
                canvas.width,

            previousY:
                previous.y/
                canvas.height,

            color:
                tool==="eraser"
                    ?"ERASER"
                    :color,

            brushSize
        });


        ctx.globalCompositeOperation=
            "source-over";


        lastPointRef.current=
            current;
    };


    /* =========================
       STOP DRAWING
    ========================= */

    const stopDrawing=e=>{

        drawingRef.current=
            false;

        lastPointRef.current=
            null;


        if(
            e?.currentTarget
                ?.hasPointerCapture
            &&
            e.currentTarget
                .hasPointerCapture(
                    e.pointerId
                )
        ){

            e.currentTarget
                .releasePointerCapture(
                    e.pointerId
                );
        }
    };


    /* =========================
       CLEAR CANVAS
    ========================= */

    const clearCanvas=()=>{

        if(!canDraw){
            return;
        }


        sendCanvasClear(
            roomId,
            playerId
        );
    };


    /* =========================
       REMOTE DRAWING EVENTS
    ========================= */

    useEffect(()=>{

        const canvas=
            canvasRef.current;


        if(!canvas){
            return;
        }


        const ctx=
            canvas.getContext(
                "2d"
            );


        for(
            let i=
                processedEventsRef.current;

            i<
            drawingEvents.length;

            i++
        ){

            const event=
                drawingEvents[i];


            /*
             * Sender already drew locally.
             */
            if(
                event.playerId===
                playerId
            ){
                continue;
            }


            /* =====================
               REMOTE FILL
            ====================== */

            if(
                event.type===
                "FILL"
            ){

                floodFill(
                    canvas,

                    event.x*
                        canvas.width,

                    event.y*
                        canvas.height,

                    event.color
                );


                continue;
            }


            /* =====================
               REMOTE STROKE
            ====================== */

            const x=
                event.x*
                canvas.width;

            const y=
                event.y*
                canvas.height;

            const previousX=
                event.previousX*
                canvas.width;

            const previousY=
                event.previousY*
                canvas.height;


            ctx.beginPath();

            ctx.moveTo(
                previousX,
                previousY
            );

            ctx.lineTo(
                x,
                y
            );


            ctx.lineWidth=
                event.brushSize;

            ctx.lineCap=
                "round";

            ctx.lineJoin=
                "round";


            if(
                event.color===
                "ERASER"
            ){

                ctx.globalCompositeOperation=
                    "destination-out";

            }else{

                ctx.globalCompositeOperation=
                    "source-over";

                ctx.strokeStyle=
                    event.color;
            }


            ctx.stroke();


            ctx.globalCompositeOperation=
                "source-over";
        }


        processedEventsRef.current=
            drawingEvents.length;

    },[
        drawingEvents,
        playerId
    ]);


    /* =========================
       REMOTE CLEAR
    ========================= */

    useEffect(()=>{

        if(
            canvasEvent?.type!==
            "CLEAR"
        ){
            return;
        }


        const canvas=
            canvasRef.current;


        if(!canvas){
            return;
        }


        const ctx=
            canvas.getContext(
                "2d"
            );


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        processedEventsRef.current=
            0;

    },[
        canvasEvent
    ]);


    /* =========================
       UI
    ========================= */

    return(

        <div className="canvas-wrapper">


            <canvas
                ref={canvasRef}
                className={
                    `canvas-element ${
                        tool==="bucket"
                            ?"bucket-cursor"
                            :""
                    }`
                }
                width={800}
                height={500}

                onPointerDown={
                    startDrawing
                }

                onPointerMove={
                    draw
                }

                onPointerUp={
                    stopDrawing
                }

                onPointerLeave={
                    stopDrawing
                }

                onPointerCancel={
                    stopDrawing
                }
            />


            {canDraw&&(

                <div className="canvas-toolbar">


                    {/* =====================
                        COLORS
                    ====================== */}

                    <div className="toolbar-left">

                        <div className="canvas-colors">

                            {colors.map(
                                item=>(

                                    <button
                                        key={
                                            item
                                        }
                                        type="button"

                                        className={
                                            `color-swatch ${
                                                tool!=="eraser"&&
                                                color===item
                                                    ?"active-color"
                                                    :""
                                            }`
                                        }

                                        style={{
                                            backgroundColor:
                                                item
                                        }}

                                        onClick={()=>{

                                            setColor(
                                                item
                                            );

                                            /*
                                             * Selecting a color while
                                             * bucket is active keeps
                                             * bucket selected.
                                             *
                                             * Selecting a color while
                                             * erasing switches to brush.
                                             */
                                            if(
                                                tool===
                                                "eraser"
                                            ){
                                                setTool(
                                                    "brush"
                                                );
                                            }
                                        }}

                                        title={
                                            item
                                        }
                                    />

                                )
                            )}

                        </div>

                    </div>


                    {/* =====================
                        BRUSH SIZE
                    ====================== */}

                    <div className="toolbar-center">

                        <span className="size-label">
                            Size
                        </span>


                        {[3,6,10,16].map(
                            size=>(

                                <button
                                    key={
                                        size
                                    }
                                    type="button"

                                    className={
                                        `brush-size-dot ${
                                            brushSize===
                                            size
                                                ?"active-size"
                                                :""
                                        }`
                                    }

                                    onClick={()=>
                                        setBrushSize(
                                            size
                                        )
                                    }

                                    title={
                                        `${size}px`
                                    }
                                >

                                    <span
                                        style={{
                                            width:
                                                `${Math.max(
                                                    5,
                                                    size
                                                )}px`,

                                            height:
                                                `${Math.max(
                                                    5,
                                                    size
                                                )}px`
                                        }}
                                    />

                                </button>

                            )
                        )}

                    </div>


                    {/* =====================
                        TOOLS
                    ====================== */}

                    <div className="canvas-tools">


                        {/* BRUSH */}

                        <button
                            type="button"

                            className={
                                tool==="brush"
                                    ?"tool-button tool-active"
                                    :"tool-button"
                            }

                            onClick={()=>
                                setTool(
                                    "brush"
                                )
                            }
                        >
                            ✏
                            <span>
                                Brush
                            </span>
                        </button>


                        {/* ERASER */}

                        <button
                            type="button"

                            className={
                                tool==="eraser"
                                    ?"tool-button tool-active"
                                    :"tool-button"
                            }

                            onClick={()=>
                                setTool(
                                    "eraser"
                                )
                            }
                        >
                            ◻
                            <span>
                                Eraser
                            </span>
                        </button>


                        {/* BUCKET */}

                        <button
                            type="button"

                            className={
                                tool==="bucket"
                                    ?"tool-button tool-active bucket-tool"
                                    :"tool-button bucket-tool"
                            }

                            onClick={()=>
                                setTool(
                                    "bucket"
                                )
                            }

                            title="Fill color"
                        >
                            🪣
                            <span>
                                Fill
                            </span>
                        </button>


                        {/* CLEAR */}

                        <button
                            type="button"
                            className="tool-button clear-tool"

                            onClick={
                                clearCanvas
                            }
                        >
                            🗑
                            <span>
                                Clear
                            </span>
                        </button>


                    </div>


                </div>

            )}

        </div>
    );
}


export default DrawingCanvas;