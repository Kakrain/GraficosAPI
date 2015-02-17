/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author mrflix / http://felixniklas.de
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//    	controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "OrbitControls" and the control should work as-is.

THREE.OrbitControls = function ( object, wrapper, _meshes, _scene, floors, things, domElement, localElement) {

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.localElement = ( localElement !== undefined ) ? localElement : document;

	// API

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the control orbits around
	// and where it pans with respect to.
	this.target = new THREE.Vector3();
	// center is old, deprecated; use "target" instead
	this.center = this.target;

	// This option actually enables dollying in and out; left as "zoom" for
	// backwards compatibility
	this.noZoom = false;
	this.zoomSpeed = 1.0;
	// Limits to how far you can dolly in and out
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// Set to true to disable this control
	this.noRotate = false;
	this.rotateSpeed = 1.0;

	// Set to true to disable this control
	this.noPan = false;
	this.keyPanSpeed = 15.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// Set to true to disable use of the keys
	this.noKeys = false;
	// The four arrow keys
	this.keys = { LEFT: 37, LEFT2: 65, UP: 38, UP2: 87, RIGHT: 39, RIGHT2: 68, DOWN: 40, DOWN2: 83, };

	////////////
	// internals

	var scope = this;

	var EPS = 0.000001;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;
	var pan = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();

	var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
	var state = STATE.NONE;

	var scene=_scene;
	var selected=null;
	var selectedIndex;
	var meshes=_meshes;
	var	mouseVector = new THREE.Vector3();
	var raycaster =  new THREE.Raycaster();
	var name;
	var gui;
	var dollarWrapper=wrapper;
	var piso=floors[0];
	var draggedIndex=null;
	var meshplane = null;
	var paralelo=new THREE.Mesh( new THREE.PlaneBufferGeometry( 10000, 10000, 1, 1 ),new THREE.MeshBasicMaterial( {transparent:true, opacity:0, side:THREE.DoubleSide}));

	scene.add(paralelo);


	// events

	var changeEvent = { type: 'change' };

	//Set the selected mesh. *Our
	this.setSelected=function(mesh){
		selected=mesh;
	}

	//Get the selected mesh. *Our
	this.getSelected=function(){
		return selected;
	}

	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	// pass in distance in world space to move left
	this.panLeft = function ( distance ) {

		var panOffset = new THREE.Vector3();
		var te = this.object.matrix.elements;
		// get X column of matrix
		panOffset.set( te[0], te[1], te[2] );
		panOffset.multiplyScalar(-distance);
		
		pan.add( panOffset );

	};

	// pass in distance in world space to move up
	this.panUp = function ( distance ) {

		var panOffset = new THREE.Vector3();
		var te = this.object.matrix.elements;
		// get Y column of matrix
		panOffset.set( te[4], te[5], te[6] );
		panOffset.multiplyScalar(distance);
		
		pan.add( panOffset );
	};
	
	// main entry point; pass in Vector2 of change desired in pixel space,
	// right and down are positive
	this.pan = function ( delta ) {

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( scope.object.fov !== undefined ) {

			// perspective
			var position = scope.object.position;
			var offset = position.clone().sub( scope.target );
			var targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( (scope.object.fov/2) * Math.PI / 180.0 );
			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			scope.panLeft( 2 * delta.x * targetDistance / element.clientHeight );
			scope.panUp( 2 * delta.y * targetDistance / element.clientHeight );

		} else if ( scope.object.top !== undefined ) {

			// orthographic
			scope.panLeft( delta.x * (scope.object.right - scope.object.left) / element.clientWidth );
			scope.panUp( delta.y * (scope.object.top - scope.object.bottom) / element.clientHeight );

		} else {

			// camera neither orthographic or perspective - warn user
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

		}

	};

	this.dollyIn = function ( dollyScale ) {

		if ( dollyScale === undefined ) {

			dollyScale = getZoomScale();

		}

		scale /= dollyScale;

	};

	this.dollyOut = function ( dollyScale ) {

		if ( dollyScale === undefined ) {

			dollyScale = getZoomScale();

		}

		scale *= dollyScale;

	};

	this.update = function () {

		var position = this.object.position;
		var offset = position.clone().sub( this.target );

		// angle from z-axis around y-axis

		var theta = Math.atan2( offset.x, offset.z );

		// angle from y-axis

		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

		if ( this.autoRotate ) {

			this.rotateLeft( getAutoRotationAngle() );

		}

		theta += thetaDelta;
		phi += phiDelta;

		// restrict phi to be between desired limits
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		var radius = offset.length() * scale;

		// restrict radius to be between desired limits
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
		
		// move target to panned location
		this.target.add( pan );

		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );

		position.copy( this.target ).add( offset );

		this.object.lookAt( this.target );

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;
		pan.set(0,0,0);
		dollarwrapper.render();	
		if ( lastPosition.distanceTo( this.object.position ) > 0 ) {

			this.dispatchEvent( changeEvent );

			lastPosition.copy( this.object.position );

		}

	};


	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function onMouseDown( event ) {

		if ( scope.enabled === false ) { return; }
		event.preventDefault();

		if ( event.button === 0 ) {
			mouseVector.x = 2 * (event.clientX / window.innerWidth) - 1;
			mouseVector.y = 1 - 2 * ( event.clientY / window.innerHeight );
			mouseVector.unproject(scope.object);
			mouseVector.sub(scope.object.position);
			mouseVector.normalize();
			raycaster.set(scope.object.position, mouseVector);
			Edown=event;
			if(selected!=null){
				//Si hay algo seleccionado intenta intersectar algun objeto perteneciente al thing seleccionado.
				intersects=raycaster.intersectObjects(selected.getMeshes());
				if(intersects.length==0){
						selected.unselect();
						selected=null;

					}
			}else{
				//Si existe algo seleccionado intenta intersecar con otro objeto thing.
				intersects = raycaster.intersectObjects(meshes);
				if ( scope.noRotate === true ) { return; }
				state = STATE.ROTATE;
				rotateStart.set( event.clientX, event.clientY );
			}
			if(intersects.length!=0){
				if(selected!=null){
					//We get the dragged index that correspond to the object. 
					draggedIndex=selected.getMeshes().indexOf(intersects[0].object);
					if(draggedIndex==0){
						paralelo.position.x=scope.object.position.x;
						paralelo.position.y=scope.object.position.y;
						paralelo.position.z=scope.object.position.z;
						paralelo.lookAt(intersects[0].object.position);
						paralelo.position.x=intersects[0].object.position.x;
						paralelo.position.y=intersects[0].object.position.y;
						paralelo.position.z=intersects[0].object.position.z;
						paralelo.updateMatrixWorld();

					}
				}else{
					var thingAndIndex = getThing(intersects[0].object);
					selected = thingAndIndex[0];
					selectedIndex = thingAndIndex[1];
					selected.select();
					//Z=selected.getMeshes()[0].position.distanceTo(scope.object.position);
					//h=scope.object.position.y-selected.getMeshes()[0].position.y;
					//c=Math.sqrt(Math.pow(Z,2)-Math.pow(h,2));
					//theta=Math.atan(scope.object.position.z/scope.object.position.x);
				}
			}


		} else if ( event.button === 1 ) {
			if ( scope.noZoom === true ) { return; }
			state = STATE.DOLLY;
			dollyStart.set( event.clientX, event.clientY );

		} else if ( event.button === 2 ) {
			/*if ( scope.noPan === true ) { return; }
			state = STATE.PAN;
			panStart.set( event.clientX, event.clientY );*/

			// Set paralelo in front of the camera view
			var pLocal = new THREE.Vector3( 0, 0, -150 );
			var pWorld = pLocal.applyMatrix4( scope.object.matrixWorld );
			var camDir = pWorld.sub( scope.object.position );
			paralelo.position.x = camDir.x + scope.object.position.x;
			paralelo.position.y = camDir.y + scope.object.position.y;
			paralelo.position.z = camDir.z + scope.object.position.z;
			paralelo.lookAt(scope.object.position);
		
			wrapper.mouseDownEvent(event.clientX,event.clientY);

		}
		scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
		if(selected==null){
				if ( state === STATE.ROTATE ) {
					if ( scope.noRotate === true ) return;
					rotateEnd.set( event.clientX, event.clientY );
					rotateDelta.subVectors( rotateEnd, rotateStart );
					// rotating across whole screen goes 360 degrees around
					scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
					// rotating up and down along whole screen attempts to go 360, but limited to 180
					scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );
					rotateStart.copy( rotateEnd );
				}
		}else{
				//If we have the draggedIndex of the array rotate around it.
				if(draggedIndex!=null){
					mouseVector.x = 2 * (event.clientX / window.innerWidth) - 1;
					mouseVector.y = 1 - 2 * ( event.clientY / window.innerHeight );
					mouseVector.unproject(scope.object);
					mouseVector.sub(scope.object.position);
					mouseVector.normalize();
					raycaster.set(scope.object.position, mouseVector);
					selected.moveTo(draggedIndex,raycaster,paralelo);
				}

			}
		scope.update();
		wrapper.mouseMoveEvent(event.clientX,event.clientY);

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;
		draggedIndex=null;


		// Right clic
		if ( event.button === 2 ) {			
			var nameAndCentr = wrapper.mouseUpEvent(event.clientX,event.clientY);
			var name = nameAndCentr[0];
			var centroid2D = nameAndCentr[1];
			var centroid = new THREE.Vector3();
			centroid.x = 2 * (centroid2D.X / window.innerWidth) - 1;
			centroid.y = 1 - 2 * ( centroid2D.Y / window.innerHeight );
			// Remove an object from the scene
			if(name == "zig-zag"){
				centroid.unproject(scope.object);
				centroid.sub(scope.object.position);
				centroid.normalize();
				raycaster.set(scope.object.position, centroid);
				var intersects = raycaster.intersectObjects(meshes);

				if (intersects.length != 0){
					if(selected == null){
						var thingAndIndex = getThing(intersects[0].object);
						var thing = thingAndIndex[0];
						var thingIndex = thingAndIndex[1];
						scene.remove(thing.getMeshes()[0]);
						things.splice(thingIndex,1);
					}
					else{
						if(intersects[0].object == selected.getMeshes()[0]){
							selected.unselect();
							scene.remove(selected.getMeshes()[0]);
							things.splice(selectedIndex,1);
							selected=null;
						}
						else{
							var thingAndIndex = getThing(intersects[0].object);
							var thing = thingAndIndex[0];
							var thingIndex = thingAndIndex[1];
							scene.remove(thing.getMeshes()[0]);
							things.splice(thingIndex,1);
						}
					}
				}
			}
			
			// Creating objects
			switch(name){
	 			//Circle creates a sphere
			 	case "circleright":
			 	case "circleleft":{
	 				addThing(1,centroid);
	 				break;
	 			}
		 		//Rectangle creates a cube
		 		case "rectangleright":
		 		case "rectangleleft":{
		 			addThing(2,centroid);
		 			break;
		 		}
		 		//Triangle creates a pyramid
		 		case "triangleleft":
		 		case "triangleright":{
		 			addThing(3,centroid);
		 			break;
				}
				//Create a plane
		  		case "planeright":
		  		case "planeleft":{
					var texturePiso = THREE.ImageUtils.loadTexture('chess.jpg');
					var geometry = new THREE.PlaneBufferGeometry( 500, 500, 1, 1 );
					var material = new THREE.MeshPhongMaterial( { /*combine: THREE.MixOperation, map:texturePiso*/color: 0xcccccc} );
						meshplane = new THREE.Mesh( geometry, material );
						meshplane.position.set(0,0,0);
						meshplane.rotation.x=-0.5*Math.PI;
						meshplane.castShadow=true;
						meshplane.receiveShadow=true;
						scene.add(meshplane);			
		 				break;
		 		}
			}
			//If a mesh is selected.
			switch(name){
					//Case X we add a new light relative to the selected mesh.
				case "Xleft":
				case "Xright":{
					var flareTexture = THREE.ImageUtils.loadTexture("whiteFlare.jpg");
					var flareColor = new THREE.Color(0xffffff);
					var xy=wrapper.center;
					mouseVector.x = 2 * (xy[0]/ window.innerWidth) - 1;
					mouseVector.y = 1 - 2 * (xy[1]/ window.innerHeight );
					mouseVector.unproject(scope.object);
					mouseVector.sub(scope.object.position);
					mouseVector.normalize();
					raycaster.set(scope.object.position, mouseVector);
					intersects = raycaster.intersectObject(piso);
					if(intersects.length!=0){
						if(selected!=null){
							var p=intersects[0].point;
							var v= selected.getMeshes()[0].position.clone();
							v.sub(p);
							v.normalize();
							raycaster.set(selected.getMeshes()[0].position,v);
							raycaster.ray.at(200,p);
							var light = new THREE.SpotLight(0xEEEEEE);
							light.target=selected.getMeshes()[0];
							light.position.x=p.x;
							light.position.y=p.y;
							light.position.z=p.z;					
							light.shadowCameraVisible = true;
							light.castShadow = true;
							light.shadowDarkness = 0.7;
							light.shadowCameraFov = 10;
							scene.add(light);
							//Bulb of light	
							var bulb = new THREE.LensFlare(flareTexture, 200, 0.0, THREE.AdditiveBlending, flareColor);
							bulb.position.set(light.position.x, light.position.y, light.position.z);
							//scene.add(bulb);

							selected.getMeshes()[0].material.needsUpdate = true;
						}
						else{
							var light = new THREE.SpotLight(0xEEEEEE);
							light.shadowCameraFov = 10;
							light.shadowDarkness = 0.7;
							light.position.set(intersects[0].point.x, 200, intersects[0].point.z);
							light.target.position.set(intersects[0].point.x, 0, intersects[0].point.z);
							light.target.updateMatrixWorld();
							light.castShadow = true;
							light.shadowCameraVisible = true;	
							scene.add(light);	
							//Bulb of light	
							var bulb = new THREE.LensFlare(flareTexture, 200, 0.0, THREE.AdditiveBlending, flareColor);
							bulb.position.set(light.position.x, light.position.y, light.position.z);
							//scene.add(bulb);					
						}
						//Important parameters to appreciate the changes.
						if(meshplane != null)
							meshplane.material.needsUpdate = true;
												
					}
					break;
				}

			}
		}
		scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.noZoom === true ) return;

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			scope.dollyOut();

		} else {

			scope.dollyIn();

		}
		// Set paralelo in front of the camera view
		var pLocal = new THREE.Vector3( 0, 0, -150 );
		var pWorld = pLocal.applyMatrix4( scope.object.matrixWorld );
		var camDir = pWorld.sub( scope.object.position );
		paralelo.position.x = camDir.x + scope.object.position.x;
		paralelo.position.y = camDir.y + scope.object.position.y;
		paralelo.position.z = camDir.z + scope.object.position.z;
		paralelo.lookAt(scope.object.position);

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false ) { return; }
		if ( scope.noKeys === true ) { return; }
		if ( scope.noPan === true ) { return; }

		// pan a pixel - I guess for precise positioning?
		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		var needUpdate = false;
		switch ( event.keyCode ) {

			case scope.keys.UP:
			case scope.keys.UP2:
				scope.pan( new THREE.Vector2( 0, scope.keyPanSpeed ) );
				needUpdate = true;
				break;
			case scope.keys.DOWN:
			case scope.keys.DOWN2:
				scope.pan( new THREE.Vector2( 0, -scope.keyPanSpeed ) );
				needUpdate = true;
				break;
			case scope.keys.LEFT:
			case scope.keys.LEFT2:
				scope.pan( new THREE.Vector2( scope.keyPanSpeed, 0 ) );
				needUpdate = true;
				break;
			case scope.keys.RIGHT:
			case scope.keys.RIGHT2:
				scope.pan( new THREE.Vector2( -scope.keyPanSpeed, 0 ) );
				needUpdate = true;
				break;
		}

		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		if ( needUpdate ) {

			scope.update();

		}

	}
	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
    this.domElement.addEventListener( 'mousedown', onMouseDown, false );
    this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    this.domElement.addEventListener( 'keydown', onKeyDown, false );


	function addThing(idMesh,centroid){
		var material = new THREE.MeshLambertMaterial({color: 'red', wireframe: true});
		switch(idMesh){
			case 1:{
				var geometry = new THREE.SphereGeometry(22,20,20);
				break;
			}
			case 2:{
				var geometry = new THREE.BoxGeometry(30,30,30);
				break;
			}
			case 3:{
				var geometry = new THREE.CylinderGeometry(0,30,40,4);
				break;
			}
		}
		var mesh = new THREE.Mesh( geometry, material );
		//$.notify("orig: " + centroid.x+","+centroid.y);
		centroid.unproject(scope.object);
		centroid.sub(scope.object.position);
		centroid.normalize();
		raycaster.set(scope.object.position, centroid);
		var intersects = [];
		if(meshplane != null) 
			intersects = raycaster.intersectObject(meshplane);
		//If centroid of the gesture intersects with the ground
		if(intersects.length > 0){
			//New object position will be relative to the ground
			mesh.position.set(intersects[ 0 ].point.x, 24, intersects[ 0 ].point.z);
		}
		else{
			//New object position will be relative to the camera view
			intersects = raycaster.intersectObject(paralelo);
			mesh.position.x = intersects[ 0 ].point.x;
			mesh.position.y = intersects[ 0 ].point.y;
			mesh.position.z = intersects[ 0 ].point.z;
		}
		mesh.castShadow=true;
		mesh.receiveShadow=true;
		var thing = new Thing(mesh,scene,floors);
		things.push(thing);
		meshes.push(mesh);
	}



};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );