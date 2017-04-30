var output = document.getElementById('output'),
  progress = document.getElementById('progress');
  idButton = document.getElementById('idButton')
modeStatus = document.getElementById('modeStatus')
var browserID = 1

var appWidth = window.innerWidth;
var appHeight = window.innerHeight;
var elem = document.getElementById('draw-shapes');
var params = { width:appWidth, height:appHeight };
var two = new Two(params).appendTo(elem);
var localCursors
var remoteCursors
var hasPeer = false;
var peer
var dataConnectionObj
var frameNum =0
var backGroup
var lastShape

var userPathData = [
  [{lastVector:null,
  lastPath:null },
  {lastVector:null,
  lastPath:null }],
  [{lastVector:null,
  lastPath:null },
  {lastVector:null,
  lastPath:null }]
]
var userColors=[]
var userModes=[0,0]

var eventEnum = {
  DEFAULT: 0,
  CIRCLE_GESTURE: 1,
  CLEAR_GESTURE: 2,
  TAP_GESTURE: 3
}

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies;
var engine = Engine.create();

restartRenderer()
restartPhysics()
generateUserColors()
setupCursors()

var gestureTimers = {
  openPinch: 0
}


function restartPhysics(){
  World.clear(engine.world,false)
  World.add(engine.world, [
      // walls
      Bodies.rectangle(appWidth/2, 0, appWidth, 50, { isStatic: true }),
      Bodies.rectangle(appWidth/2, appHeight, appWidth, 50, { isStatic: true }),
      Bodies.rectangle(appWidth, appHeight/2, 50, appHeight, { isStatic: true }),
      Bodies.rectangle(0, appHeight/2, 50, appHeight, { isStatic: true })
  ]);
  engine.world.gravity.y = 1;
  var bodies = Matter.Composite.allBodies(engine.world);
  for(var i =0; i<bodies.length;i++) {
    bodies.friction = 1
  }
}

function restartRenderer(){
  two.clear()
  backGroup = two.makeGroup()
  frontGroup = two.makeGroup()
}

function changeBrowserID(){
  browserID = browserID == 0 ? 1 : 0
  idButton.innerHTML = "Browser ID: " + browserID
}

function makePeer(){
  var localID = "aajunction" + browserID,key
  peer = new Peer(localID, {key: 'abblrhx3zryynwmi'});
  console.log("making local peer with id:" + localID)

  peer.on('connection', function(conn) {
    console.log("connectedAsSlave!")
    dataConnectionObj = conn
    hasPeer = true
    conn.on('data', function(data){
      parseRemoteInput(data)
    });
  });
}

function setupPeerConnection() {
  makePeer()

  var remoteID = 'aajunction' + (browserID == 0 ? 1 : 0)
  console.log("connecting to peer with remote id:"+remoteID)
  dataConnectionObj = peer.connect(remoteID,{reliable:false,serialization:"json"})
  dataConnectionObj.on('open',function(){console.log("connectedAsMaster!")})
  dataConnectionObj.on('data', function(data){
    parseRemoteInput(data)
  });
  hasPeer = true
}

//MAIN LOOP (uses requestAnimationFrame)
var leapController = Leap.loop({background: true}, {
  frame: function(frame){
    console.log(frame.gestures)
    var bodies = Matter.Composite.allBodies(engine.world);
    for (var i =0;i<bodies.length;i++) {
      var body = bodies[i]
      var renderShape = bodies[i].renderShape
      if(renderShape){
        renderShape.translation.set(body.position.x,body.position.y)
        renderShape.rotation = body.angle

      }

    }
    Engine.update(engine, 1000/60)
    frameNum ++
    localInput = getLocalInput(frame,leapController)
    if (hasPeer){
      if(frameNum % 1 ==0){
        dataConnectionObj.send(localInput)
      }
    }
    updateState(localInput,localCursors,0)
    two.update()

}
});

function getLocalInput (frame,controller){
  var input = []
  var cursorInput

  var iBox = frame.interactionBox;

  for (var i =0; i<2; i++) {
    hand = frame.hands[i]
    if (hand) {
      var pointable = hand.pointables[1];
      if (pointable) {
        //var leapPoint = pointable.stabilizedTipPosition;
        var leapPoint = hand.palmPosition
        var normalizedPoint = iBox.normalizePoint(leapPoint, true);

        var appX = normalizedPoint[0] //* appWidth;
        var appY = (1 - normalizedPoint[1])// * appHeight;

        var cursorInput = new CIO(appX,appY,false,0)

        var gesture = frame.gestures[0]
        if(gesture){
          if (gesture.type == "circle") {
            if(!controller.frame(1).gestures[0]){
              cursorInput.Md = eventEnum.CIRCLE_GESTURE
            }
          }
          if (gesture.type =="keyTap") {
            cursorInput.Md = eventEnum.TAP_GESTURE
          }
        }


        if(hand.pinchStrength ==0) {
          gestureTimers.openPinch ++
          if(  gestureTimers.openPinch > 150) {
            restartPhysics()
            restartRenderer()
            setupCursors()
          }
        }
        else {
          gestureTimers.openPinch = 0
        }
        if(hand.pinchStrength >= 0.5) {
          cursorInput.Cc = true
        }
        else {
          cursorInput.Cc = false
        }

        input[i]=(cursorInput)
      }
  }
  else {
    //localCursors[i].translation.set(-100,-100)
    }
  }
  return input
}


function CIO(Xpos,Ypos, cursorClosed,mode) {
  this.Xp = Math.round(Xpos * 10000) / 10000
  this.Yp = Math.round(Ypos * 10000) / 10000
  this.Cc = cursorClosed
  this.Md = mode
}

function parseRemoteInput(input){
  updateState(input,remoteCursors,1)
}

function updateState(input,cursors,user) {
  for (var i =0; i<2; i++) {
    if(input[i]){
      if(input[i].Cc) {
        cursors[i].fill = "FFFFFF"
      }
      else {
        cursors[i].fill= userColors[user]
      }
      if(user==0) { //if user is the local user
        modeStatus.innerHTML="Mode: "+ (userModes[user])
      }
      switch(userModes[user]) {
        case 0:
          manageDrawPaths(input[i].Xp*appWidth, input[i].Yp*appHeight,input[i].Cc,user,i)
          break
        case 1:
          addCircle(input[i].Xp*appWidth, input[i].Yp*appHeight,input[i].Md)
          break
      }
      //if there is an gesture event, do stuff
      switch(input[i].Md ) {
        case 1:
          userModes[user]++
          userModes[user] = userModes[user]%3
          break;
      }
      cursors[i].translation.set(input[i].Xp*appWidth,input[i].Yp*appHeight)

    }
  }
}

function setupCursorColors(localC,remoteC){
  for (var i = 0; i<2; i++){
    localC[i].stroke= userColors[0]
    localC[i].linewidth=6;
  }
  for (var i = 0; i<2; i++){
    remoteC[i].stroke=userColors[1]
    remoteC[i].linewidth=6
  }
}

function addCircle(x,y,isLive){
  if (isLive) {
    rad = Math.random()*20+10
    circle = two.makeCircle(x,y,rad)
    circle.stroke = randomColor();
    circle.fill=randomColor()
    circle.linewidth = 1;

    circleBody = Matter.Bodies.circle(x,y,rad)
    circleBody.renderShape = circle

    backGroup.add(circle)
    World.add(engine.world,[circleBody])


  }
}

function manageDrawPaths(x,y,isLive,user,cursor) {
  var vector = new Two.Vector(x,y)
  vector.position = new Two.Vector().copy(vector);
  pathData = userPathData[user][cursor]


  if(isLive) {
    if(pathData.lastPath){
      pathData.lastPath.vertices.push(vector)
  }
    else if (pathData.lastVector){
      pathData.lastPath = two.makePath([vector,pathData.lastVector],false)
      backGroup.add(pathData.lastPath)

      _.each(pathData.lastPath.vertices, function(v) {
                v.addSelf(pathData.lastPath.translation);
              });
      pathData.lastPath.translation.clear();
      pathData.lastPath.stroke = randomColor();
      pathData.lastPath.fill=randomColor()
      pathData.lastPath.linewidth = 1;
    }
    pathData.lastVector = vector
  }
  else if(pathData.lastPath){
    //path finished
    var simplifiedVertices = simplify(pathData.lastPath.vertices,40,true)
    var curved = simplifiedVertices.length > 5 ? true : false
    //TODO: fix self-intersection checking algo
    intersects = false;//checkSelfIntersection(simplifiedVertices)

    if(!intersects){

      var center = Matter.Vertices.centre(simplifiedVertices);
      var centertedVerts = Matter.Vertices.translate(simplifiedVertices, center, -1);
      var newShape = new Two.Path(centertedVerts,true,false)
      var testBody = Bodies.fromVertices(0,0,centertedVerts)

      if(testBody) {

        newShape.opacity = 0.8
        newShape.stroke = pathData.lastPath.stroke
        newShape.fill = pathData.lastPath.fill
        newShape.lineWidth = pathData.lastPath.lineWidth

        Matter.Body.setPosition(testBody,center)
        newShape.translation.set(center.x,center.y)

        newShape.scale = 0.5
        Matter.Body.scale(testBody,0.5,0.5)

        testBody.friction = 1

        backGroup.add(newShape)
        testBody.renderShape=newShape
        World.add(engine.world,[testBody])
      }

      lastShape = newShape
    }

    backGroup.remove(pathData.lastPath)
    pathData.lastPath = null

  }
  else {
    pathData.lastVector = null
  }
}

function generateUserColors(){
  for (i = 0; i<2; i++) {
    userColors[i]=randomColor()
  }
}

function setupCursors() {
  cursorRadius = 10
  localCursors = [
    two.makeCircle(0, 0, cursorRadius),
    two.makeCircle(0, 0, cursorRadius),
  ]
  remoteCursors = [
    two.makeCircle(0, 0, cursorRadius),
    two.makeCircle(0, 0, cursorRadius),
  ]
  for(var i =0;i<4;i++){
    frontGroup.add(localCursors.concat(remoteCursors)[i])
  }
  setupCursorColors(localCursors,remoteCursors)
}

function calculateCenter(verts){
  centerX = 0;
  centerY=0;
  for (var i = 0; i<verts.length;i++){
    centerX+=verts[i].x;
    centerY+=verts[i].y
  }
  centerX/=verts.length;
  centerY/=verts.length
  return new Two.Vector(centerX,centerY)
}

function checkSelfIntersection(vectors){
  var intersects = false
  for(var i =0; i< vectors.length-2; i++){
    var lastEdge = vectors.slice(i,i+2)
    var otherEdges = vectors.slice(0,i).concat(vectors.slice(i+2,vectors.length))
    intersects = intersects || checkSelfIntersectionEdge(otherEdges,lastEdge)
  }
  return intersects
}

function checkSelfIntersectionEdge(vectors,edge) {
  var intersects = false
  for (var i =0; i<vectors.length-1;i++) {
    p1 = vectors[i]
    p2 = vectors[i+1]
    p3 = edge[0]
    p4 = edge[1]

    intersects = intersects || linesIntersect(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y,p4.x,p4.y)
  }
  return intersects

}

function linesIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return true;
}
