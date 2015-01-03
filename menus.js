var CubeShape = function (_mesh){
	var box = new THREE.Box3().setFromObject(_mesh.getMeshes()[0]);

	//Properties of shadows.
	this.CastShadow = true;
	this.ReceiveShadow = true;
	this.ShadowDarkness=1;

	//Type of Materials
	this.Phong = false;
	this.Gouraud = false;
	this.Flat = false;

	//Colors
	this.Color = [0,128,255];

	//Textures
	this.textures = "texture.jpg";


	//Position
	this.XPosition = '0';
	this.YPosition = '0';
	this.ZPosition = '0';

	//Geometry
    this.width = box.max.x-box.min.x;
    this.height = box.max.y-box.min.y;
    this.depth = box.max.z-box.min.z;

}