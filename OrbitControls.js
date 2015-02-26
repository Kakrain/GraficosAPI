
THREE.OrbitControls = function ( object, wrapper, _meshes, _scene, floors, things, domElement, localElement) {

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.localElement = ( localElement !== undefined ) ? localElement : document;


	// Activa los controles o los desactiva.
	this.enabled = true;


	this.target = new THREE.Vector3();
	this.center = this.target;
	this.noZoom = false;
	this.zoomSpeed = 1.0; //Velocidad de Zoom
	this.minDistance = 0;
	this.maxDistance = Infinity;
	this.noRotate = false;
	this.rotateSpeed = 1.0; //Velocidad de Rotacion
	this.noPan = false;
	this.keyPanSpeed = 15.0;	// Cantidad de pixeles por tecla presionada.
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 segundos por vuelta cuando tenemos 60 fps.
	this.minPolarAngle = 0; 
	this.maxPolarAngle = Math.PI; 

	this.noKeys = false; //No usar teclas.
	this.keys = { LEFT: 37, LEFT2: 65, UP: 38, UP2: 87, RIGHT: 39, RIGHT2: 68, DOWN: 40, DOWN2: 83, };

	//Variables internas.
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

	//Variables de escena.
	var rotating=-1; //0 para mover paralelo a la camara, 1 x, 2 y, 3 z
	var scene=_scene; //Escena
	var selected=null; //Mesh Seleccionado
	var Edown=null; //Mouse Presionado 
	var selectedIndex; //Indice de Seleccion
	var meshes=_meshes; //Meshes
	var	mouseVector = new THREE.Vector3(); 
	var raycaster =  new THREE.Raycaster();
	var name; //Nombre del Gesto
	var gui; //Cuadro de controles.
	var dollarWrapper=wrapper; //Encapsulado del Dollar.js
	var piso=floors[0]; //Pisos
	var draggedIndex=null;
	var meshplane = null; //Plano de la escena.
	var	vector = new THREE.Vector3();
	var paralelo=new THREE.Mesh( new THREE.PlaneBufferGeometry( 10000, 10000, 1, 1 ),new THREE.MeshBasicMaterial( {transparent:true, opacity:0, side:THREE.DoubleSide})); //Plano para picking.

	scene.add(paralelo);
	menuPrincipal();//Menu de Control.


	var changeEvent = { type: 'change' };

	//Setear el mesh seleccionado
	this.setSelected=function(mesh){
		selected=mesh;
	}
	//Obtener el mesh seleccionado.
	this.getSelected=function(){
		return selected;
	}

	//Rotar a la izquierda
	this.rotateLeft = function ( angle ) {
		if ( angle === undefined ) {
			angle = getAutoRotationAngle();
		}
		thetaDelta -= angle;
	};

	//Rotar hacia arriba
	this.rotateUp = function ( angle ) {
		if ( angle === undefined ) {
			angle = getAutoRotationAngle();
		}
		phiDelta -= angle;
	};

	// Pasar una distancia para moverse a la izquierda.
	this.panLeft = function ( distance ) {
		var panOffset = new THREE.Vector3();
		var te = this.object.matrix.elements;
		panOffset.set( te[0], te[1], te[2] );
		panOffset.multiplyScalar(-distance);
		pan.add( panOffset );
	};

	// Pasar una distancia para moverse a la derecha.
	this.panUp = function ( distance ) {
		var panOffset = new THREE.Vector3();
		var te = this.object.matrix.elements;
		panOffset.set( te[4], te[5], te[6] );
		panOffset.multiplyScalar(distance);
		pan.add( panOffset );
	};
	
	//Funcion principal de desplazamiento.
	this.pan = function ( delta ) {

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( scope.object.fov !== undefined ) {
			var position = scope.object.position;
			var offset = position.clone().sub( scope.target );
			var targetDistance = offset.length();
			targetDistance *= Math.tan( (scope.object.fov/2) * Math.PI / 180.0 );
			scope.panLeft( 2 * delta.x * targetDistance / element.clientHeight );
			scope.panUp( 2 * delta.y * targetDistance / element.clientHeight );
		} else if ( scope.object.top !== undefined ) {
			// orthographic
			scope.panLeft( delta.x * (scope.object.right - scope.object.left) / element.clientWidth );
			scope.panUp( delta.y * (scope.object.top - scope.object.bottom) / element.clientHeight );
		} else {
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
		}
	};

	//Scroll adentro.
	this.dollyIn = function ( dollyScale ) {
		if ( dollyScale === undefined ) {
			dollyScale = getZoomScale();
		}
		scale /= dollyScale;
	};

	//Scroll afuera.
	this.dollyOut = function ( dollyScale ) {
		if ( dollyScale === undefined ) {
			dollyScale = getZoomScale();
		}
		scale *= dollyScale;
	};

	//Funcion de Update.
	this.update = function () {

		var position = this.object.position;
		var offset = position.clone().sub( this.target );
		var theta = Math.atan2( offset.x, offset.z );
		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

		if ( this.autoRotate ) {
			this.rotateLeft( getAutoRotationAngle() );
		}

		theta += thetaDelta;
		phi += phiDelta;
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );
		var radius = offset.length() * scale;
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
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


	//Mouse Down Listener
	function onMouseDown( event ) {
		//Cuando Clickeamos desactivamos el rotating.
		rotating=-1;
		//Click izquierdo
		if ( event.button === 0 ) {
			mouseVector.x = 2 * (event.clientX / window.innerWidth) - 1;
			mouseVector.y = 1 - 2 * ( event.clientY / window.innerHeight );
			mouseVector.unproject(scope.object);
			mouseVector.sub(scope.object.position);
			mouseVector.normalize();
			raycaster.set(scope.object.position, mouseVector);
			Edown=event;
			//Si hay algo seleccionado intenta intersecar ese mesh y devolvernos lo que ha intersecado.
			if(selected!=null){
				intersects=raycaster.intersectObjects(selected.getMeshes());
				//Sino interseca nada es xq hizo click afuera de la pantalla, deselecciona el objeto.
				if(intersects.length==0){
					selected.unselect();
					selected=null;

				}
			}else{
				//Si no existe nada seleccionado intenta intersecar con otro objeto del mesh principal.
				intersects = raycaster.intersectObjects(meshes);
				if ( scope.noRotate === true ) { return; }
				state = STATE.ROTATE;
				//Inicia el movimiento de rotacion.
				rotateStart.set( event.clientX, event.clientY );
			}
			//Comprueba si ha intersectado algo.
			if(intersects.length!=0){
				//Si hay algo seleccionado obtiene el index del componente intersectado..
				if(selected!=null){
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
				//Sino es por que ha seleccionado otro thing y ahora es nuestro nuevo seleccionado.
				}else{
					var thingAndIndex = getThing(intersects[0].object);
					selected = thingAndIndex[0];
					selectedIndex = thingAndIndex[1];
					selected.select();
				}
			}
		//Rueda de en medio para acercar o alejar.
		} else if ( event.button === 1 ) {
			state = STATE.DOLLY;
			dollyStart.set( event.clientX, event.clientY );
		//Click derecho crea los sprites del dollar.js y se prepara a enviarlos, adicionalmente actualiza la posicion del plano del picking.
		} else if ( event.button === 2 ) {
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
		//Anadimos los eventos luego de hacer click.
		scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
	}

	//Mouse Move Listener.
	function onMouseMove( event ) {
		//Si esta el mouse presionado
		if(Edown!=null){
			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
			//Si no hay nada seleccionado entonces rota la pantalla.
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
			//Si hay algo seleccionado mueve el objeto correspondiente.
			}else{
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
			Edown=event;
		//Si el mouse no esta presionado entonces valida el parametro rotating para rotar el objeto.
		}else{
			if(rotating!=-1){
				mouseVector.x = 2 * (event.clientX / window.innerWidth) - 1;
				mouseVector.y = 1 - 2 * ( event.clientY / window.innerHeight );
				mouseVector.unproject(camera);
				mouseVector.sub(camera.position);
				mouseVector.normalize();
				raycaster.set(camera.position, mouseVector);	
				paralelo.position.x=selected.getMeshes()[0].position.x;
				paralelo.position.y=selected.getMeshes()[0].position.y;
				paralelo.position.z=selected.getMeshes()[0].position.z;
				//Ejes de rotacion, x y z y libre.
				switch(rotating){
					case 0:{
						paralelo.lookAt(camera.position);
						break;
					}
					case 1:{
						vector.set(selected.getMeshes()[0].position.x+10,selected.getMeshes()[0].position.y,selected.getMeshes()[0].position.z);
						paralelo.lookAt(vector);
						break;	
					}
					case 2:{
						vector.set(selected.getMeshes()[0].position.x,selected.getMeshes()[0].position.y+10,selected.getMeshes()[0].position.z);
						paralelo.lookAt(vector);
						break;
					}
					case 3:{
						vector.set(selected.getMeshes()[0].position.x,selected.getMeshes()[0].position.y,selected.getMeshes()[0].position.z+10);
						paralelo.lookAt(vector);
						break;
					}
				}
				paralelo.updateMatrixWorld();
				intersects = raycaster.intersectObject(paralelo);
				//Si esta intersecando algo entonces mira al objeto y refresca el tamano.
				if(intersects.length!=0){
					var p=intersects[0].point;
					selected.getMeshes()[0].lookAt(p);
					selected.getMeshes()[4].lookAt(p);
					selected.updateSizers();
				}
			}
		}	
		scope.update();
		//Envia las coordenadas para el dibujado de los sprites.
		wrapper.mouseMoveEvent(event.clientX,event.clientY);

	}

	// Mouse Up Listenere.
	function onMouseUp( event ) {

		draggedIndex=null;
		Edown=null;
		// Right click
		if ( event.button === 2 ) {			
			var nameAndCentr = wrapper.mouseUpEvent(event.clientX,event.clientY);
			var name = nameAndCentr[0];
			var centroid2D = nameAndCentr[1];
			var centroid = new THREE.Vector3();
			centroid.x = 2 * (centroid2D.X / window.innerWidth) - 1;
			centroid.y = 1 - 2 * ( centroid2D.Y / window.innerHeight );
			// Zig Zag remueve objeto de la escena.
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
			if(selected==null){
			// Switch para crear meshes si no hay nada seleccionado.
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
				}else
				{
				//Si hay algo seleccionado.
				switch(name){
					//Circulo nos permite rotar.
					case "circleright":
					case "circleleft":{
						rotating=0;
						break;
					}
						//X agrega una luz entre el objeto y el plano.
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
								scene.add(bulb);
								selected.getMeshes()[0].material.needsUpdate = true;
							//Important parameters to appreciate the changes.
							if(meshplane != null)
								meshplane.material.needsUpdate = true;

						}
						break;
					}

				}
			}
		}
		scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
		state = STATE.NONE;
	}
	//On mouse wheel event.
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
		// Actualiza la posicion del plano del picking.
		var pLocal = new THREE.Vector3( 0, 0, -150 );
		var pWorld = pLocal.applyMatrix4( scope.object.matrixWorld );
		var camDir = pWorld.sub( scope.object.position );
		paralelo.position.x = camDir.x + scope.object.position.x;
		paralelo.position.y = camDir.y + scope.object.position.y;
		paralelo.position.z = camDir.z + scope.object.position.z;
		paralelo.lookAt(scope.object.position);

	}
	//On key down event.
	function onKeyDown( event ) {

		var needUpdate = false;
		//Controles para el manejo de la camara con los keys de direccion.
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
		//Controles para el manejo del eje de rotacion del objeto.
		if(rotating!=-1){
			switch(event.keyCode){
				case 88: 
				rotating = 1;
				break;
				case 89: 
				rotating = 2;
				break;
				case 90: 
				rotating = 3;
				break;
			}	
		}

		if ( needUpdate ) {
			scope.update();
		}

	}
	//Anadimos los listeneres de los eventos.
	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    this.localElement.addEventListener( 'keydown', onKeyDown, false );

    //Funcion para anadir un mesh respecto a lo que se dibuje con el gesto.
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

	//Funcion para el menu de controles fijo.
	function menuPrincipal(){
		var color = Math.random() * 0xffffff;
		var  meshConfig = new meshConfigData();
		var meshGui = new dat.GUI();
 		//Folder Position
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
			selected.getMeshes()[0].material = new THREE.MeshLambertMaterial();
			} //Revisar error Color Ambiente
			else if ( meshConfig.material === 'phong' ) {
				selected.getMeshes()[0].material = new THREE.MeshPhongMaterial();
			}
		} );

 		Properties2.add( meshConfig, 'wireframe', false ).onChange( function() {
 			selected.getMeshes()[0].material.wireframe = meshConfig.wireframe;
 		} ); 

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

	}



};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );