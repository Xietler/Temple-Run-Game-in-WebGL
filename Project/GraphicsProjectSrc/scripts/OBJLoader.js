OBJLoader = function(filename, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
    request.open("GET", filename, true);
    request.send();

    request.onreadystatechange = function () {
        if(request.readyState === 4 && request.status == 200){
            //获取到数据调用方法处理
            onReadOBJFile(request.responseText, filename, gl, model, scale, reverse);
        }
    }

    //obj文件读取成功后开始解析
    function onReadOBJFile(fileString, fileName, gl, obj, scale, reverse) {
        var objDoc = new OBJDoc(fileName); // 创建一个OBJDoc 对象
        var result = objDoc.parse(fileString, scale, reverse); //解析文件
        if(!result){
            g_objDoc = null;
            g_drawingInfo = null;
            console.log("obj文件解析错误");
            return;
        }else {
            //解析成功赋值给g_objDoc
            g_objDoc = objDoc;
        }
    }

    //obj文件已经成功读取解析后处理函数
    function onReadComplete(gl, model, objDoc) {
        //从OBJ文件获取顶点坐标和颜色
        var drawingInfo = objDoc.getDrawingInfo();

        //将数据写入缓冲区

        console.log("数据开始");
        console.log("顶点坐标",drawingInfo.vertices);
        console.log("法向量",drawingInfo.normals);
        console.log("颜色",drawingInfo.colors);
        console.log("索引值",drawingInfo.indices);
        //顶点
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

        //法向量
        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

        //颜色
        gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

        //索引值
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

        return drawingInfo;
    }

    //模型角度改变函数
    var angle_step = 30;
    var last = +new Date();
    function animate(angle) {
        var now = +new Date();
        var elapsed = now - last;
        last = now;
        var newAngle = angle + (angle_step*elapsed)/1000.0;
        return newAngle%360;
    }

    // OBJDoc object
    // Constructor
    var OBJDoc = function(fileName) {
        this.fileName = fileName;
        this.mtls = new Array(0);      // Initialize the property for MTL
        this.objects = new Array(0);   // Initialize the property for Object
        this.vertices = new Array(0);  // Initialize the property for Vertex
        this.normals = new Array(0);   // Initialize the property for Normal
    }

    // Parsing the OBJ file
    OBJDoc.prototype.parse = function(fileString, scale, reverse) {
        var lines = fileString.split('\n');  // Break up into lines and store them as array
        lines.push(null); // Append null
        var index = 0;    // Initialize index of line

        var currentObject = null;
        var currentMaterialName = "";

        // Parse line by line
        var line;         // A string in the line to be parsed
        var sp = new StringParser();  // Create StringParser
        while ((line = lines[index++]) != null) {
            sp.init(line);                  // init StringParser
            var command = sp.getWord();     // Get command
            if(command == null)	 continue;  // check null command

            switch(command){
                case '#':
                    continue;  // Skip comments
                case 'mtllib':     // Read Material chunk
                    var path = this.parseMtllib(sp, this.fileName);
                    var mtl = new MTLDoc();   // Create MTL instance
                    this.mtls.push(mtl);
                    var request = new XMLHttpRequest();
                    request.onreadystatechange = function() {
                        if (request.readyState == 4) {
                            if (request.status != 404) {
                                MTLLoader(request.responseText, mtl);
                            }else{
                                mtl.complete = true;
                            }
                        }
                    }
                    request.open('GET', path, true);  // Create a request to acquire the file
                    request.send();                   // Send the request
                    continue; // Go to the next line
                case 'o':
                case 'g':   // Read Object name
                    var object = this.parseObjectName(sp);
                    this.objects.push(object);
                    currentObject = object;
                    continue; // Go to the next line
                case 'v':   // Read vertex
                    var vertex = this.parseVertex(sp, scale);
                    this.vertices.push(vertex);
                    continue; // Go to the next line
                case 'vn':   // Read normal
                    var normal = this.parseNormal(sp);
                    this.normals.push(normal);
                    continue; // Go to the next line
                case 'usemtl': // Read Material name
                    currentMaterialName = this.parseUsemtl(sp);
                    continue; // Go to the next line
                case 'f': // Read face
                    var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
                    currentObject.addFace(face);
                    continue; // Go to the next line
            }
        }

        return true;
    }

    OBJDoc.prototype.parseMtllib = function(sp, fileName) {
        // Get directory path
        var i = fileName.lastIndexOf("/");
        var dirPath = "";
        if(i > 0) dirPath = fileName.substr(0, i+1);

        return dirPath + sp.getWord();   // Get path
    }

    OBJDoc.prototype.parseObjectName = function(sp) {
        var name = sp.getWord();
        return (new OBJObject(name));
    }

    OBJDoc.prototype.parseVertex = function(sp, scale) {
        var x = sp.getFloat() * scale;
        var y = sp.getFloat() * scale;
        var z = sp.getFloat() * scale;
        return (new Vertex(x, y, z));
    }

    OBJDoc.prototype.parseNormal = function(sp) {
        var x = sp.getFloat();
        var y = sp.getFloat();
        var z = sp.getFloat();
        return (new Normal(x, y, z));
    }

    OBJDoc.prototype.parseUsemtl = function(sp) {
        return sp.getWord();
    }

    OBJDoc.prototype.parseFace = function(sp, materialName, vertices, reverse) {
        var face = new Face(materialName);
        // get indices
        for(;;){
            var word = sp.getWord();
            if(word == null) break;
            var subWords = word.split('/');
            if(subWords.length >= 1){
                var vi = parseInt(subWords[0]) - 1;
                face.vIndices.push(vi);
            }
            if(subWords.length >= 3){
                var ni = parseInt(subWords[2]) - 1;
                face.nIndices.push(ni);
            }else{
                face.nIndices.push(-1);
            }
        }

        // calc normal
        var v0 = [
            vertices[face.vIndices[0]].x,
            vertices[face.vIndices[0]].y,
            vertices[face.vIndices[0]].z];
        var v1 = [
            vertices[face.vIndices[1]].x,
            vertices[face.vIndices[1]].y,
            vertices[face.vIndices[1]].z];
        var v2 = [
            vertices[face.vIndices[2]].x,
            vertices[face.vIndices[2]].y,
            vertices[face.vIndices[2]].z];

        var normal = calcNormal(v0, v1, v2);
        if (normal == null) {
            if (face.vIndices.length >= 4) { 
                var v3 = [
                    vertices[face.vIndices[3]].x,
                    vertices[face.vIndices[3]].y,
                    vertices[face.vIndices[3]].z];
                normal = calcNormal(v1, v2, v3);
            }
            if(normal == null){         
                normal = [0.0, 1.0, 0.0];
            }
        }
        if(reverse){
            normal[0] = -normal[0];
            normal[1] = -normal[1];
            normal[2] = -normal[2];
        }
        face.normal = new Normal(normal[0], normal[1], normal[2]);

        // Devide to triangles if face contains over 3 points.
        if(face.vIndices.length > 3){
            var n = face.vIndices.length - 2;
            var newVIndices = new Array(n * 3);
            var newNIndices = new Array(n * 3);
            for(var i=0; i<n; i++){
                newVIndices[i * 3 + 0] = face.vIndices[0];
                newVIndices[i * 3 + 1] = face.vIndices[i + 1];
                newVIndices[i * 3 + 2] = face.vIndices[i + 2];
                newNIndices[i * 3 + 0] = face.nIndices[0];
                newNIndices[i * 3 + 1] = face.nIndices[i + 1];
                newNIndices[i * 3 + 2] = face.nIndices[i + 2];
            }
            face.vIndices = newVIndices;
            face.nIndices = newNIndices;
        }
        face.numIndices = face.vIndices.length;

        return face;
    }

    //------------------------------------------------------------------------------
    // Common function
    //------------------------------------------------------------------------------
    function calcNormal(p0, p1, p2) {
        // v0: a vector from p1 to p0, v1; a vector from p1 to p2
        var v0 = new Float32Array(3);
        var v1 = new Float32Array(3);
        for (var i = 0; i < 3; i++){
            v0[i] = p0[i] - p1[i];
            v1[i] = p2[i] - p1[i];
        }

        // The cross product of v0 and v1
        var c = new Float32Array(3);
        c[0] = v0[1] * v1[2] - v0[2] * v1[1];
        c[1] = v0[2] * v1[0] - v0[0] * v1[2];
        c[2] = v0[0] * v1[1] - v0[1] * v1[0];

        // Normalize the result
        var v = new Vector3(c);
        v.normalize();
        return v.elements;
    }
}