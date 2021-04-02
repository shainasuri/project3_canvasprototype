console.log("hello")

let canvas;
let ctx;
let savedImageData;
let dragging = false;
let strokeColor = 'black';
let fillColor = 'black';
let line_Width = 2;
let polygonSides = 6;
let currentTool = 'brush';
let canvasWidth = 600;
let canvasHeight = 600;

let usingBrush = false;
let brushXPoints = new Array();
let brushYPoints = new Array();
let brushDownPosition = new Array();


class ShapeBoundingBox{
    constructor(left, top, width, height){
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}

class mouseDownPosition{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class PolygonPoint{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class Location{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}

let shapeBoundingBox = new ShapeBoundingBox(0,0,0,0);
let mouseDown = new mouseDownPosition(0,0);
let loc = new Location(0,0);

document.addEventListener('DOMContentLoaded', setupCanvas);

function setupCanvas(){
    canvas = document.querySelector('#my-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.linewidth = line_Width;
    canvas.addEventListener("mousedown", reactToMouseDown);
    canvas.addEventListener("mousemove", reactToMouseMove);
    canvas.addEventListener("mouseup", reactToMouseUp);
}

function changeTool(toolClicked){
    document.querySelector('#open').className = "";
    document.querySelector('#save').className = "";
    document.querySelector('#brush').className = "";
    document.querySelector('#line').className = "";
    document.querySelector('#rectangle').className = "";
    document.querySelector('#circle').className = "";
    document.querySelector('#ellipse').className = "";
    document.querySelector('#polygon').className = "";
    document.getElementById(toolClicked).className = 'selected';
    currentTool = toolClicked;
}

// get mouse position
function getMousePosition(x,y){
    let canvasSizeData = canvas.getBoundingClientRect();
    return { x: (x - canvasSizeData.left) * (canvas.width  / canvasSizeData.width),
        y: (y - canvasSizeData.top)  * (canvas.height / canvasSizeData.height)
      };
}

// save canvas image 
function saveCanvasImage(){
    savedImageData = ctx.getImageData(0,0,canvas.width,canvas.height);
}

// redraw canvas image
function redrawCanvasImage(){
    ctx.putImageData(savedImageData,0,0);
}

// update rubberband size data
function updateRubberbandSizeData (loc){
    shapeBoundingBox.width = Math.abs(loc.x - mouseDown.x);
    shapeBoundingBox.height = Math.abs(loc.y - mouseDown.y);

    if(loc.x > mouseDown.x){
        shapeBoundingBox.left = mouseDown.x;
    } else {
        shapeBoundingBox.left = loc.x;
    }    
    
    if(loc.y > mouseDown.y){
        shapeBoundingBox.top = mouseDown.y;
    } else {
        shapeBoundingBox.top = loc.y;
    }   
}

// get angle using x & y (trigonometry)
function getAngleUsingXAndY(mouselocX, mouselocY){
    let adjacent = mouseDown.x - mouselocX;
    let opposite = mouseDown.y - mouselocY;
    return radiansToDegrees(Math.atan2(opposite, adjacent));
}

// convert from radians to degrees 
function radiansToDegrees(rad){
    return (rad * (180 / Math.PI)).toFixed(2);
}

// convert from degrees to radians
function degreesToRadians(degrees){
    return degrees * (Math.PI / 180);
}

function getPolygonPoints(){
    let angle = degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));
    let radiusX = shapeBoundingBox.width;
    let radiusY = shapeBoundingBox.width;
    let polygonPoints = [];
    // X = mouseloc.X + radiusX * Sin(angle)
    // Y = mouseloc.y + radiusX * Cos(angle)

    for(let i = 0; i < polygonSides; i++){
        polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle), loc.y - radiusY & Math.cos(angle)));
        angle += 2 * Math.PI /polygonSides;
    }
    return polygonPoints;
}

function getPolygon(){
    let polygonPoints = getPolygonPoints();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonSides; i++){
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y) 
    }
    ctx.closePath();
}

// update rubberband on movement 
function updateRubberbandOnMove(loc){
    updateRubberbandSizeData(loc);
    drawRubberbandShape(loc);
}

function drawRubberbandShape(loc){
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;

    if(currentTool === "brush"){
        drawBrush();
    } else if(currentTool === "line"){
        ctx.beginPath();
        ctx.moveTo(mouseDown.x, mouseDown.y);
        ctx.lineTo(loc.x, loc.y);
        ctx.stroke();
    } else if(currentTool === "rectangle"){
        ctx.strokeRect(shapeBoundingBox.left, shapeBoundingBox.top, shapeBoundingBox.width, shapeBoundingBox.height);
    } else if(currentTool === "circle"){
        console.log('circle');
        let radius = shapeBoundingBox.width;
        ctx.beginPath();
        ctx.arc(mouseDown.x, mouseDown.y, radius, 0, Math.PI * 2);
    } else if(currentTool === "ellipse"){
        let radiusX = shapeBoundingBox.width / 2;
        let radiusY = shapeBoundingBox.height / 2;
        ctx.beginPath();
        ctx.ellipse(mouseDown.x, mouseDown.y, radiusX, radiusY, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    } else if(currentTool === "polygon"){
        getPolygon();
        ctx.stroke();
    }
}

function AddBrushPoint(x, y, mouseDown){
    brushXPoints.push(x);
    brushYPoints.push(y);
    brushDownPosition.push(mouseDown);
}

function drawBrush(){
    for(let i = 1; i < brushXPoints.length; i++){
        ctx.beginPath();
        if(brushDownPosition[i]){
            ctx.moveTo(brushXPoints[i-1], brushYPoints[i-1]);
        } else {
            ctx.moveTo(brushXPoints[i]-1, brushYPoints[i]);
        }
        ctx.lineTo(brushXPoints[i], brushYPoints[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

// reactToMouseDown 
function reactToMouseDown(e){
    console.log('mouse is pressed');
    canvas.style.cursor = "crosshair";
    // store location
    loc = getMousePosition(e.clientX, e.clientY);
    // save the current canvas image
    saveCanvasImage();
    // store mouse position when clicked
    mouseDown.x = loc.x;
    mouseDown.y = loc.y;
    dragging = true;

    // handle brush
    if(currentTool === 'brush'){
        usingBrush = true;
        AddBrushPoint(loc.x, loc.y);
    }
}
// reactToMouseMove
function reactToMouseMove(e){
    canvas.style.cursor = "crosshair";
    loc = getMousePosition(e.clientX, e.clientY);
    // handle brush
    if(currentTool === 'brush' && dragging && usingBrush){
        if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
            AddBrushPoint(loc.x, loc.y);
        }
        redrawCanvasImage();
        drawBrush();    
    } else {
        if(dragging){
        redrawCanvasImage();
        updateRubberbandOnMove(loc);
        }
    }  
};

// reactToMouseUp
function reactToMouseUp(e){
    canvas.style.cursor = "default";
    loc = getMousePosition(e.clientX, e.clientY);
    redrawCanvasImage();
    updateRubberbandOnMove(loc);
    dragging = false;
    usingBrush = false;

}
// saveImage
function saveImage(){
    var imageFile = document.querySelector('#img-file');
    imageFile.setAttribute('download', 'apple.png');
    imageFile.setAttribute('href', canvas.toDataURL());
}
// openImage
function OpenImage(){
    let img = new Image();
    img.onload = function(){
        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.drawImage(img,0,0);
    }
    img.src = 'apple.png';
}

// reference for code taken from: https://www.youtube.com/watch?v=R5MqjOoLGtU