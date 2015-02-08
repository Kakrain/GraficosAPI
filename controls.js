 function Controls(_camera,wrapper,_meshes,_scene,floors,things){

	//Variables
	var scene=_scene;
	var selected=null;
	var selectedIndex;
	var Z=5;
	var theta=0.0;
	var h=0.0;
	var c= 0;
	var k=0;
	var Edown=null;
	var camera=_camera;
	var meshes=_meshes;
	var name;
	var cubeMenu;
	var gui;
	var dollarWrapper=wrapper;
	var	mouseVector = new THREE.Vector3();
	var raycaster =  new THREE.Raycaster();
	var velocity=0.1;
	var forward=false;
	var backward=false;
	var right=false;
	var left=false;
	var up=false;
	var down=false;
	var piso=floors[0];
	var draggedIndex=null;
	var paralelo=new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000, 1, 1 ),new THREE.MeshBasicMaterial( {transparent:true,opacity:0.2, side:THREE.DoubleSide}));

	//Camera Position
	camera.position.set(0,5,5);
	camera.lookAt(new THREE.Vector3(0,0,0));
	camera.rotation.order = "YXZ";
	menuPrincipal();

	//Set the selected mesh.
	this.setSelected=function(mesh){
		selected=mesh;
	}
	//Get the selected mesh.
	this.getSelected=function(){
		return selected;
	}

	this.render=function(){
		//If we got a selected array of meshes.
		if(selected!=null&&draggedIndex==null){
			if (forward) { //w and up key
					h+=0.1;
				} else if (backward) { //s and down key
					h-=0.1;
				} 
			    if (right) { //d and right key
			    	theta-= 0.05;
			    } else if (left) { //a and left key
			    	theta+= 0.05;
			    }
			    if (up) { //q and space key
			    	Z-=0.05;
			    } else if (down) { //e and ctrl key
			    	Z+=0.05;		    	
			    } 
				if(h<-(Z-0.1)){h=-(Z-0.1);}
					else if(h>(Z-0.1))
						{h=(Z-0.1);}
			var x,y,z;
			c=Math.sqrt(Math.pow(Z,2)-Math.pow(h,2));
			x=c*Math.cos(theta);
			z=c*Math.sin(theta);
			//Position the camera acording the formula and mesh position.
			camera.position.x = x+selected.getMeshes()[0].position.x;
			camera.position.y = h+selected.getMeshes()[0].position.y;
			camera.position.z = z+selected.getMeshes()[0].position.z;
			//We focus the camera to the first mesh on the array
			camera.lookAt(selected.getMeshes()[0].position);
		}
		//If we don't have any array selected we control the scene with the keyboard.
		else{
			var vector;
			 vector= new THREE.Vector3( 0, 0, -1 );
			vector.applyQuaternion( camera.quaternion );
				if (up) { //w and up key
					camera.position.x+=velocity*vector.x;
					camera.position.z+=velocity*vector.z;
				} else if (down) { //s and down key
					camera.position.x-=velocity*vector.x;
					camera.position.z-=velocity*vector.z;
				} 
				vector = new THREE.Vector3( 1, 0,0);
				vector.applyQuaternion( camera.quaternion );
			    if (right) { //d and right key
			    	camera.position.x+=velocity*vector.x;
			    	camera.position.z+=velocity*vector.z;
			    } else if (left) { //a and left key
			    	camera.position.x-=velocity*vector.x;
			    	camera.position.z-=velocity*vector.z;
			    }
			    if (forward) { //q and space key
			    	camera.position.y+=velocity;
			    } else if (backward) { //e and ctrl key
			    	camera.position.y-=velocity;
			    } 
			}
		dollarwrapper.render();	
	}
// 	function wheel(e){
//         var delta = 0;
//         if (!e) /* For IE. */
//                 e = window.event;
//         if (e.wheelDelta) { /* IE/Opera. */
//                 delta = e.wheelDelta/120;
//                 k=0.05;
// 				zoom-=k*(delta);
// 				if(zoom<0.1){zoom=0.1;}
// 				if(zoom>75){zoom=75;}
//         } else if (e.detail) { /** Mozilla case. */
//                 delta = -e.detail;
//                 k=0.05;
// 				zoom-=k*(delta)*10;
// 				if(zoom<0.1){zoom=0.1;}
// 				if(zoom>75){zoom=75;}
//         }
//         if (e.preventDefault)
//                 e.preventDefault();
// 		e.returnValue = false;
// }

// if (window.addEventListener)
//         window.addEventListener('DOMMouseScroll', wheel, false);
// window.onmousewheel = document.onmousewheel = wheel;

	document.onmousewheel=function(e){
		k=0.05;
		zoom-=k*(e.wheelDelta);
		if(zoom<0.1){zoom=0.1;}
		if(zoom>75){zoom=75;}
	}

	//Mouse listener on mouse down/Set the selected mesh.
	document.onmousedown = function(e) {
		//Switch for controlling wich button was pressed.
		switch(e.button){
			//Left Mouse Button for controlling the camera.

			case 0:{
				mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
				mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );
				mouseVector.unproject(camera);
				mouseVector.sub(camera.position);
				mouseVector.normalize();
				raycaster.set(camera.position, mouseVector);
				Edown=e;
				if(selected!=null){
					//We create a raycaster for the thing mesh if we have selected one.
					intersects=raycaster.intersectObjects(selected.getMeshes());
					if(intersects.length==0){
						selected.unselect();
						selected=null;

					}

				}else
					//We create a raycaster for the main mesh if we dont have selected anything yet.
					intersects = raycaster.intersectObjects(meshes);
				if(intersects.length!=0){
					if(selected!=null){
						//We get the dragged index that correspond to the cube. 
						draggedIndex=selected.getMeshes().indexOf(intersects[0].object);
							if(draggedIndex==0){
							paralelo.position.x=camera.position.x;
							paralelo.position.y=camera.position.y;
							paralelo.position.z=camera.position.z;
							paralelo.lookAt(intersects[0].object.position);
							paralelo.position.x=intersects[0].object.position.x;
							paralelo.position.y=intersects[0].object.position.y;
							paralelo.position.z=intersects[0].object.position.z;
							paralelo.updateMatrixWorld();
						}
							if(draggedIndex==4){
							//selected.outlineOrientation
							createSphere(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z,'red');
							//$.notify("direccion:"+intersects[0].face.normal.x+","+intersects[0].face.normal.y+","+intersects[0].face.normal.z,{autoHide:false});	
							selected.outlineOrientation=intersects[0].face.normal;
							selected.interpoint=intersects[0].point;
							//raycaster.set(selected.getMeshes()[0].position,intersects[0].point);
							//	intersects=raycaster.intersectObject(selected.getMeshes()[4],true);
							//$.notify("distance: " +intersects.distance+" point: "+intersects.point+" face: "+intersects.face+" faceindex: "+intersects.indices+" indices: "+intersects.indices+" objects: "+intersects.object,{autoHide:false});	
						}
					}else{
						var thingAndIndex = getThing(intersects[0].object);
						selected = thingAndIndex[0];
						selectedIndex = thingAndIndex[1];
						selected.select();
						Z=selected.getMeshes()[0].position.distanceTo(camera.position);
						h=camera.position.y-selected.getMeshes()[0].position.y;
						c=Math.sqrt(Math.pow(Z,2)-Math.pow(h,2));
						theta=Math.atan(camera.position.z/camera.position.x);
					}
				}
				break;
			}
			//Middle button for unselect any mesh.
			case 1:
			{
				if(selected!=null){
					selected.unselect();
				}
				selected=null;
				break;
			}
			//Rigth button for prepare the gestures recognizer.
			case 2:{
				wrapper.mouseDownEvent(e.clientX,e.clientY);
				break;
			}
		}
	}

	//Mouse listener on mouse down/Sent the coordinates of the mouse.
	document.onmousemove = function(e) {
		//If we have left click pressed.
		if(Edown!=null){
			//If we don't have selected anything.
			if(selected==null){
				camera.rotation.y-= k*(e.pageX-Edown.pageX);
				camera.rotation.x-= k*(e.pageY-Edown.pageY);
				camera.rotation.x=Math.max(Math.min(camera.rotation.x,Math.PI/2),-Math.PI/2);
			}else{
				//If we have the draggedIndex of the array rotate around it.
				if(draggedIndex!=null){
					mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
					mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );
					mouseVector.unproject(camera);
					mouseVector.sub(camera.position);
					mouseVector.normalize();
					raycaster.set(camera.position, mouseVector);
					selected.moveTo(draggedIndex,raycaster,paralelo);
				}

			}
			Edown=e
		}
		//We sent the mouse coordinates to the gesture recognizer.
		wrapper.mouseMoveEvent(e.clientX,e.clientY);
	}

	//Mouse listener on mouse up/Active the gesture.
	document.onmouseup = function(e) {
		//Reset the variables because the mouse is up.
		Edown=null;
		draggedIndex=null;
		//name=wrapper.mouseUpEvent(e.clientX,e.clientY);
		var nameAndCentr = wrapper.mouseUpEvent(e.clientX,e.clientY);
		var name = nameAndCentr[0];
		var centroid2D = nameAndCentr[1];
		var centroid = new THREE.Vector3();
		centroid.x = 2 * (centroid2D.X / window.innerWidth) - 1;
		centroid.y = 1 - 2 * ( centroid2D.Y / window.innerHeight );
		// Remove an object from the scene
		if(name == "deleteright" || name == "deleteleft"){
			centroid.unproject(camera);
			centroid.sub(camera.position);
			centroid.normalize();
			raycaster.set(camera.position, centroid);
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
					selected.unselect();
					scene.remove(selected.getMeshes()[0]);
					things.splice(selectedIndex,1);
					selected=null;
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
		  case "planeright":
		  case "planeleft":{
		var texturePiso = THREE.ImageUtils.loadTexture('chess.jpg');
		var geometry = new THREE.PlaneBufferGeometry( 500, 500, 1, 1 );
		var material = new THREE.MeshPhongMaterial( { combine: THREE.MixOperation, map:texturePiso, ambient: 0xffffff, specular: 0x050505 } );
			var meshplane = new THREE.Mesh( geometry, material );
			meshplane.position.set(0,0,0);
			meshplane.castShadow=true;
			meshplane.receiveShadow=true;
			scene.add(meshplane);
			camera.position.set(100,100,100);
		 	break;
		 }
		}
		//If a mesh is selected.
		if(selected!=null){
			switch(name){
				//Case Zig-Zag we add a new light relative to the selected mesh.
				case "zig-zag":
				{
					var xy=wrapper.center;
					mouseVector.x = 2 * (xy[0]/ window.innerWidth) - 1;
					mouseVector.y = 1 - 2 * (xy[1]/ window.innerHeight );
					mouseVector.unproject(camera);
					mouseVector.sub(camera.position);
					mouseVector.normalize();
					raycaster.set(camera.position, mouseVector);
					intersects = raycaster.intersectObject(piso);
					if(intersects.length!=0){
						var p=intersects[0].point;
						var v=cube.position.clone();
						v.sub(p);
						v.normalize();
						raycaster.set(cube.position,v);
						raycaster.ray.at(5,p);
						var light = new THREE.SpotLight( 0xffffff, 1 );
						light.castShadow = true;
						light.shadowDarkness = 0.7;
						light.shadowCameraRight =  1;
						light.shadowCameraLeft = -1;
						light.shadowCameraTop =  1;
						light.shadowCameraBottom = -1;
						light.target=selected.getMeshes()[0];
						light.position.x=p.x;
						light.position.y=p.y;
						light.position.z=p.z;
						light.shadowCameraFar = 10;
						light.shadowCameraNear=1;
						//light.target.updateMatrixWorld();
						light.shadowCameraVisible = true;
						scene.add(light);
						//Important parameters to appreciate the changes.
						piso.material.needsUpdate = true;
						cube.material.needsUpdate = true;
						break;
					}
				}

			}
		}

	}

	

	function menuPrincipal(){
	var color = Math.random() * 0xffffff;
	var  meshConfig = new meshConfigData();
 	var meshGui = new dat.GUI();
 		//Folder Position
 		var Properties1 = meshGui.addFolder('Geometria');
 		Properties1.add( meshConfig, 'positionX' ).onFinishChange( function(){
		  selected.getMeshes()[0].position.x = ( meshConfig.positionX);
		  selected.getMeshes()[1].position.x = ( meshConfig.positionX);
		  selected.getMeshes()[2].position.x = ( meshConfig.positionX);
		  selected.getMeshes()[4].position.x = ( meshConfig.positionX);


		} );
		Properties1.add( meshConfig, 'positionY' ).onFinishChange( function() {
		  selected.getMeshes()[0].position.y = ( meshConfig.positionY);
		  selected.getMeshes()[2].position.y = ( meshConfig.positionY);
		  selected.getMeshes()[3].position.y = ( meshConfig.positionY);
		  selected.getMeshes()[4].position.y = ( meshConfig.positionY);
		} );  
		Properties1.add( meshConfig, 'positionZ' ).onFinishChange( function() {
		  selected.getMeshes()[0].position.z = ( meshConfig.positionZ);
		  selected.getMeshes()[1].position.z = ( meshConfig.positionZ);
		  selected.getMeshes()[3].position.z = ( meshConfig.positionZ);
		  selected.getMeshes()[4].position.z = ( meshConfig.positionZ);
		} ); 
		Properties1.add( meshConfig, 'rotationX', -3.14, 3.14).step(0.01).onChange( function(){
		  selected.getMeshes()[0].rotation.x = ( meshConfig.rotationX );
		  selected.getMeshes()[4].rotation.x = ( meshConfig.rotationX );
		} );
		Properties1.add( meshConfig, 'rotationY', -3.14, 3.14).step(0.01).onChange( function() {
		  selected.getMeshes()[0].rotation.y = ( meshConfig.rotationY );
		  selected.getMeshes()[4].rotation.y = ( meshConfig.rotationY);
		} );  
		Properties1.add( meshConfig, 'rotationZ', -3.14, 3.14 ).onChange( function() {
		  selected.getMeshes()[0].rotation.z = ( meshConfig.rotationZ );
		  selected.getMeshes()[4].rotation.z = ( meshConfig.rotationZ );
		} ); 
		Properties1.add( meshConfig, 'scaleX', 0, 10 ).onChange( function(){
			selected.getMeshes()[0].scale.x = ( meshConfig.scaleX );
			selected.getMeshes()[4].scale.x = ( meshConfig.scaleX );
		} );
		Properties1.add( meshConfig, 'scaleY', 0, 10 ).onChange( function() {
			selected.getMeshes()[0].scale.y = ( meshConfig.scaleY );
			selected.getMeshes()[4].scale.y = ( meshConfig.scaleY );
		} );  
		//Revisar error outline scale.
		Properties1.add( meshConfig, 'scaleZ', 0, 10 ).onChange( function() {
			selected.getMeshes()[0].scale.z = ( meshConfig.scaleZ );
			selected.getMeshes()[4].scale.z = ( meshConfig.scaleZ );
		} ); 

		var Properties2 = meshGui.addFolder('Aspecto');
		Properties2.addColor( meshConfig, 'color1', color ).onChange( function() {
		    selected.getMeshes()[0].material.color.set(meshConfig.color1); 
		    selected.getMeshes()[0].material.ambient.set(meshConfig.color1);  
		  } ); 
		Properties2.add( meshConfig, 'castShadow', false ).onChange( function() {
			selected.getMeshes()[0].castShadow = meshConfig.castShadow;
		} ); 
		Properties2.add( meshConfig, 'visible', false ).onChange( function() {
			selected.getMeshes()[0].visible = meshConfig.visible;
			selected.getMeshes()[4].visible = meshConfig.visible;
		} ); 
		Properties2.add( meshConfig, 'material', [ 'normal','basic','phong' ] ).onChange( function() {
		// console.log( box2Config.material );
			if ( meshConfig.material === 'normal' ) {
				selected.getMeshes()[0].material = new THREE.MeshNormalMaterial();
			} else if ( meshConfig.material === 'basic' ) {
				selected.getMeshes()[0].material = new THREE.MeshBasicMaterial();
			} //Revisar error Color Ambiente
			else if ( meshConfig.material === 'phong' ) {
				selected.getMeshes()[0].material = new THREE.MeshPhongMaterial();
			}
		} );

		Properties2.add( meshConfig, 'wireframe', false ).onChange( function() {
			selected.getMeshes()[0].material.wireframe = meshConfig.wireframe;
		} ); 
		Properties2.add( meshConfig, 'opacity', [ 'quarter','half','three-quarters','full' ] ).onChange( function() {
		console.log( meshConfig.opacity );
			if ( meshConfig.opacity == 'quarter' ) {
				selected.getMeshes()[0].material.opacity = 0.25;
			} else if ( meshConfig.opacity == 'half' ) {
				selected.getMeshes()[0].material.opacity = 0.5;    
			} else if ( meshConfig.opacity == 'three-quarters' ) {
				selected.getMeshes()[0].material.opacity = 0.75;
			} else if ( meshConfig.opacity == 'full' ) {
				selected.getMeshes()[0].material.opacity = 1.0;
			}
		} );
	}
							


	//Keyboard listener on key down for the camera keyboard controlling.
	window.onkeydown = function (e) {
		var code = e.keyCode ? e.keyCode : e.which;
		switch(code){
			case 49://1
			{
				if(hemiLightIN){scene.remove( hemiLight );}
				else{scene.add( hemiLight );}
				hemiLightIN=!hemiLightIN;
				cube.material.needsUpdate = true;
				break;
			}
			case 50://2
			{
				if(dirLightIN){scene.remove(dirLight);}
				else{scene.add(dirLight);}
				dirLightIN=!dirLightIN;
				piso.material.needsUpdate = true;
				cube.material.needsUpdate = true;
				break;
			}
			case 51://3
			{
				if(lightIN){scene.remove(spotLight);}
				else{scene.add(spotLight);}
				lightIN=!lightIN;

				break;
			}
			case 38: // up
			case 87: // w
				forward = true;
			break;
			case 37: // left
			case 65: // a
				left = true; 
			break;
			case 40: // down
			case 83: // s
				backward = true;
			break;
			case 39: // right
			case 68: // d
				right = true;
			break;
			case 32: // space
			case 81: //q
				up = true;
			break;
			case 17: // space
			case 69: //e
				down = true;
			break;

		}

	}
	
	//Keyboard listener on key up for the camera keyboard controlling.
	window.onkeyup=function(e){
		var code = e.keyCode ? e.keyCode : e.which;
		switch( code ) {
				case 38: // up
				case 87: // w
				forward = false;
				break;
				case 37: // left
				case 65: // a
				left = false;
				break;
				case 40: // down
				case 83: // s
				backward = false;
				break;
				case 39: // right
				case 68: // d
				right = false;
				break;
				case 32: // space
				case 81:
				up = false;
				break;
				case 17: // space
				case 69:
				down = false;
				break;
		}
	}

	function addThing(idMesh,centroid){
			var material = new THREE.MeshLambertMaterial({color: 'red'});
			switch(idMesh){
				case 1:{
					var geometry = new THREE.SphereGeometry(1,20,20);
					break;
				}
				case 2:{
					var geometry = new THREE.CubeGeometry(1,1,1);
					break;
				}
				case 3:{
					var geometry = new THREE.CylinderGeometry(0,1,1.5,4);
					break;
				}
			}
			var mesh = new THREE.Mesh( geometry, material );
			centroid.unproject(camera);
			centroid.sub(camera.position);
			centroid.normalize();
			raycaster.set(camera.position, centroid);
			var intersects = raycaster.intersectObject(piso);
			//If centroid of the gesture intersects with the ground
			if(intersects.length > 0){
			//New object position will be relative to the ground
			mesh.position.set(intersects[ 0 ].point.x, 2, intersects[ 0 ].point.z);
		}
		else{
			//Calculate the direction of camera view
			var pLocal = new THREE.Vector3( 0, 0, -7 );
			var pWorld = pLocal.applyMatrix4( camera.matrixWorld );
			var camDir = pWorld.sub( camera.position );
			//New object position will be relative the camera view
			mesh.position.x = (camDir.x + camera.position.x) + (centroid.x*10);
			mesh.position.y = (camDir.y + camera.position.y) + (centroid.y*10);
			mesh.position.z = (camDir.z + camera.position.z) + centroid.z;
		}
		//camera.lookAt(mesh.position);
		mesh.castShadow=true;
		mesh.receiveShadow=true;
		var thing= new Thing(mesh,scene,floors);
		things.push(thing);
		meshes.push(mesh);
	}
}