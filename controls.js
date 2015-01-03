function Controls(_camera,wrapper,_meshes,_scene,_piso){

	//Variables
	var scene=_scene;
	var selected=null;
	var Z=5;
	var theta=0.0;
	var h=0.0;
	var c= 0;
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
	var piso=_piso;
	var draggedIndex=null;
	var paralelo=new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000, 1, 1 ),new THREE.MeshBasicMaterial( {transparent:true,opacity:0.2, side:THREE.DoubleSide}));

	//Camera Position
	camera.position.set(0,5,5);
	camera.lookAt(new THREE.Vector3(0,0,0));
	camera.rotation.order = "YXZ";

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
			var vector = new THREE.Vector3( 0, 0, -1 );
			vector.applyQuaternion( camera.quaternion );
				if (forward) { //w and up key
					camera.position.x+=velocity*vector.x;
					camera.position.z+=velocity*vector.z;
				} else if (backward) { //s and down key
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
			    if (up) { //q and space key
			    	camera.position.y+=velocity;
			    } else if (down) { //e and ctrl key
			    	camera.position.y-=velocity;
			    } 
			}
		dollarwrapper.render();	
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
					}else{
						selected=getThing(intersects[0].object);
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
		var k=0.05;
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
				//Else we rotate free the camera.
				else{
					theta+= k*(e.pageX-Edown.pageX);
					if(theta<0){theta+=2*Math.PI;}
					else if(theta>2*Math.PI){theta-=2*Math.PI;}
					h+= k*(e.pageY-Edown.pageY);
					if(h<-(Z-0.1)){h=-(Z-0.1);}
					else if(h>(Z-0.1)){h=(Z-0.1);}
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
		name=wrapper.mouseUpEvent(e.clientX,e.clientY);
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
				//Case rectangle we got a new Menu relative to the selected mesh.
				case "rectangle":
				{
					cubeMenu = new CubeShape(selected);
					gui = new dat.GUI();
					
					var fd1 = gui.addFolder('Geometry');
						fd1.add(cubeMenu, 'width', 0, 10).onChange(redrawx);
				        fd1.add(cubeMenu, 'height', 0, 10).onChange(redrawy);
				        fd1.add(cubeMenu, 'depth', 0, 10).onChange(redrawz);

			        var fd2 = gui.addFolder('Shadows');
			        	fd2.add(cubeMenu, 'CastShadow').onFinishChange(reshadowcast);
			        	fd2.add(cubeMenu, 'ReceiveShadow').onFinishChange(reshadowreceive);
			        	fd2.add(cubeMenu, 'ShadowDarkness',0,1).onChange(reshadowdarkness);

			        var fd3 = gui.addFolder('Material-Color-Texture');
			       		fd3.add(cubeMenu, 'Phong');
			       		fd3.add(cubeMenu, 'Gouraud');
			       		fd3.add(cubeMenu, 'Flat');
			       		fd3.addColor(cubeMenu, 'Color');
			       		fd3.add(cubeMenu, 'textures', ['madera','metal','cemento']);

			        // var fd4 = gui.addFolder('Position');
			        // 	fd4.add(cubeMenu, 'XPosition').onFinishChange(repositionx);
			        // 	fd4.add(cubeMenu, 'YPosition').onFinishChange(repositiony);
			        // 	fd4.add(cubeMenu, 'ZPosition').onFinishChange(repositionz);
			        break;

				}
			}
		}
	}

	//Function for modify properties.
	var redrawx=function(){
		selected.resizex(cubeMenu.width);
	}
	var redrawy=function(){
		selected.resizey(cubeMenu.height);
	}
	var redrawz=function(){
		selected.resizez(cubeMenu.depth);
	}
	var reshadowcast=function(){
		if(cubeMenu.CastShadow == false)
			selected.getMeshes()[0].castShadow = false;
		else
			selected.getMeshes()[0].castShadow = true;
	}
	var reshadowreceive=function(){
		if(cubeMenu.CastShadow == false)
			selected.getMeshes()[0].receiveShadow = false;
		else
			selected.getMeshes()[0].receiveShadow = true;
	}
	var reshadowdarkness=function(){
		dirLight.shadowDarkness = cubeMenu.ShadowDarkness;
		piso.material.needsUpdate = true;
	}
	// var repositionx=function(){
	// 	selected.getMeshes()[0].position.x = cubeMenu.XPosition;
	// 	selected.getMeshes()[1].position.x = cubeMenu.XPosition;
	// 	selected.getMeshes()[2].position.x = cubeMenu.XPosition;
	// 	selected.getMeshes()[3].position.x = cubeMenu.XPosition;
	// 	selected.outline.position.x = cubeMenu.XPosition;;
	// }
	// var repositiony=function(){
	// 	selected.getMeshes()[0].position.y = cubeMenu.YPosition;
	// }
	// var repositionz=function(){
	// 	selected.getMeshes()[0].position.z = cubeMenu.ZPosition;
	// }

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
}