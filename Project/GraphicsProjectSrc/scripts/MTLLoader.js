MTLLoader = function(fileString, mtl) {
    var lines = fileString.split('\n');  // Break up into lines and store them as array
    lines.push(null);           // Append null
    var index = 0;              // Initialize index of line

    // Parse line by line
    var line;      // A string in the line to be parsed
    var name = ""; // Material name
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
        sp.init(line);                  // init StringParser
        var command = sp.getWord();     // Get command
        if(command == null)	 continue;  // check null command

        switch(command){
            case '#':
                continue;    // Skip comments
            case 'newmtl': // Read Material chunk
                name = mtl.parseNewmtl(sp);    // Get name
                continue; // Go to the next line
            case 'Kd':   // Read normal
                if(name == "") continue; // Go to the next line because of Error
                var material = mtl.parseRGB(sp, name);
                mtl.materials.push(material);
                name = "";
                continue; // Go to the next line
        }
    }
    mtl.complete = true;
}

// Check Materials
OBJDoc.prototype.isMTLComplete = function() {
    if(this.mtls.length == 0) return true;
    for(var i = 0; i < this.mtls.length; i++){
        if(!this.mtls[i].complete) return false;
    }
    return true;
}

// Find color by material name
OBJDoc.prototype.findColor = function(name){
    for(var i = 0; i < this.mtls.length; i++){
        for(var j = 0; j < this.mtls[i].materials.length; j++){
            if(this.mtls[i].materials[j].name == name){
                return(this.mtls[i].materials[j].color)
            }
        }
    }
    return(new Color(0.8, 0.8, 0.8, 1));
}

// Retrieve the information for drawing 3D model
OBJDoc.prototype.getDrawingInfo = function() {
    // Create an arrays for vertex coordinates, normals, colors, and indices
    var numIndices = 0;
    for(var i = 0; i < this.objects.length; i++){
        numIndices += this.objects[i].numIndices;
    }
    var numVertices = numIndices;
    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var colors = new Float32Array(numVertices * 4);
    var indices = new Uint16Array(numIndices);

    // Set vertex, normal and color
    var index_indices = 0;
    for(var i = 0; i < this.objects.length; i++){
        var object = this.objects[i];
        for(var j = 0; j < object.faces.length; j++){
            var face = object.faces[j];
            var color = this.findColor(face.materialName);
            var faceNormal = face.normal;
            for(var k = 0; k < face.vIndices.length; k++){
                // Set index
                indices[index_indices] = index_indices;
                // Copy vertex
                var vIdx = face.vIndices[k];
                var vertex = this.vertices[vIdx];
                vertices[index_indices * 3 + 0] = vertex.x;
                vertices[index_indices * 3 + 1] = vertex.y;
                vertices[index_indices * 3 + 2] = vertex.z;
                // Copy color
                colors[index_indices * 4 + 0] = color.r;
                colors[index_indices * 4 + 1] = color.g;
                colors[index_indices * 4 + 2] = color.b;
                colors[index_indices * 4 + 3] = color.a;
                // Copy normal
                var nIdx = face.nIndices[k];
                if(nIdx >= 0){
                    var normal = this.normals[nIdx];
                    normals[index_indices * 3 + 0] = normal.x;
                    normals[index_indices * 3 + 1] = normal.y;
                    normals[index_indices * 3 + 2] = normal.z;
                }else{
                    normals[index_indices * 3 + 0] = faceNormal.x;
                    normals[index_indices * 3 + 1] = faceNormal.y;
                    normals[index_indices * 3 + 2] = faceNormal.z;
                }
                index_indices ++;
            }
        }
    }

    return new DrawingInfo(vertices, normals, colors, indices);
}

//------------------------------------------------------------------------------
// MTLDoc Object
//------------------------------------------------------------------------------
var MTLDoc = function() {
    this.complete = false; // MTL is configured correctly
    this.materials = new Array(0);
}

MTLDoc.prototype.parseNewmtl = function(sp) {
    return sp.getWord();         // Get name
}

MTLDoc.prototype.parseRGB = function(sp, name) {
    var r = sp.getFloat();
    var g = sp.getFloat();
    var b = sp.getFloat();
    return (new Material(name, r, g, b, 1));
}

//------------------------------------------------------------------------------
// Material Object
//------------------------------------------------------------------------------
var Material = function(name, r, g, b, a) {
    this.name = name;
    this.color = new Color(r, g, b, a);
}

//------------------------------------------------------------------------------
// Vertex Object
//------------------------------------------------------------------------------
var Vertex = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

//------------------------------------------------------------------------------
// Normal Object
//------------------------------------------------------------------------------
var Normal = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

//------------------------------------------------------------------------------
// Color Object
//------------------------------------------------------------------------------
var Color = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
}

//------------------------------------------------------------------------------
// OBJObject Object
//------------------------------------------------------------------------------
var OBJObject = function(name) {
    this.name = name;
    this.faces = new Array(0);
    this.numIndices = 0;
}

OBJObject.prototype.addFace = function(face) {
    this.faces.push(face);
    this.numIndices += face.numIndices;
}

//------------------------------------------------------------------------------
// Face Object
//------------------------------------------------------------------------------
var Face = function(materialName) {
    this.materialName = materialName;
    if(materialName == null)  this.materialName = "";
    this.vIndices = new Array(0);
    this.nIndices = new Array(0);
}

//------------------------------------------------------------------------------
// DrawInfo Object
//------------------------------------------------------------------------------
var DrawingInfo = function(vertices, normals, colors, indices) {
    this.vertices = vertices;
    this.normals = normals;
    this.colors = colors;
    this.indices = indices;
}

//------------------------------------------------------------------------------
// Constructor
var StringParser = function(str) {
    this.str;   // Store the string specified by the argument
    this.index; // Position in the string to be processed
    this.init(str);
}
// Initialize StringParser object
StringParser.prototype.init = function(str){
    this.str = str;
    this.index = 0;
}

// Skip delimiters
StringParser.prototype.skipDelimiters = function()  {
    for(var i = this.index, len = this.str.length; i < len; i++){
        var c = this.str.charAt(i);
        // Skip TAB, Space, '(', ')
        if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"') continue;
        break;
    }
    this.index = i;
}

// Skip to the next word
StringParser.prototype.skipToNextWord = function() {
    this.skipDelimiters();
    var n = getWordLength(this.str, this.index);
    this.index += (n + 1);
}

// Get word
StringParser.prototype.getWord = function() {
    this.skipDelimiters();
    var n = getWordLength(this.str, this.index);
    if (n == 0) return null;
    var word = this.str.substr(this.index, n);
    this.index += (n + 1);

    return word;
}

// Get integer
StringParser.prototype.getInt = function() {
    return parseInt(this.getWord());
}

// Get floating number
StringParser.prototype.getFloat = function() {
    return parseFloat(this.getWord());
}

// Get the length of word
function getWordLength(str, start) {
    var n = 0;
    for(var i = start, len = str.length; i < len; i++){
        var c = str.charAt(i);
        if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"')
            break;
    }
    return i - start;
}