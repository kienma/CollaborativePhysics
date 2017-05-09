# CollaborativePhysics
Browser and Leap-motion based collaborative physics playground.

# About 
CollaborativePhysics is an online physics playground that supports mouse and keyboard, and Leap Motion inputs. CollaborativePhysics was first
built at the [Tokyo 2017 Junction Hackathon](http://tokyo.hackjunction.com/) in April of 2017. 

A CollaborativePhysics session allows for the user to create objects in three modes—mode 0, mode 1, or mode 2. 
Mode 0 allows for the user to draw static polygons. The user draws the outline of a shape, and from this outline, the
CollaborativePhysics environment produces a polygon of similar shape. This polygon is static and is not affected by gravity. 
In Mode 1, the user can create dynamic circles. These circles are affected by gravity and friction and are especially 
useful in exploring situations such as a ball rolling down a ramp.  
Using Made 2, users can create dynamic polygons. Similar to mode 0, the user draws each vertex, from which a polygon is 
produced. These polygons, in contrast to Mode 0, are affected by gravity and friction. Such objects are useful in 
explore the dynamics of blocks sliding down ramps and other scenarios. 

In addition, objects in CollaborativePhysics sessions can be cleared. 

CollaborativePhysics is built on [Collab.js](https://github.com/DenisVuyka/collab.js), 
[Matter.js](http://brm.io/matter-js/), and [Two.js](https://two.js.org/).

# Mouse and Keyboard Controls  

### Keyboard 
| Button | Function | 
| --- | --- | 
| c | Clear session space |
| spacebar | Switch mode |

### Mouse Click Control 
| Mode | Click function |
| --- | --- | 
| 0 | Create shape | 
| 1 | Create circle | 
| 2 | Create shape | 

### 
# Leap Motion Controls 
### Universal Controls 
| Gesture | Function | 
| --- | --- | 
| Palm up and fist closed, hold | Clear session | 
| Palm up | Switch mode | 

### Mode 0 

| Gesture | Function | 
| --- | --- | 
|Pinch and draw |Create shape |

### Mode 1 

| Gesture | Function | 
| --- | --- | 
|Tap |Create circle | 

### Mode 2 

| Gesture | Function | 
| --- | --- | 
|Pinch and draw |Create shape | 

