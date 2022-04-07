let vertexShaderSource = `#version 300 es
in vec2 a_position;

uniform vec2 u_resolution;

// Translation to add to position
uniform vec2 u_translation;

void main() {
  // Add in the translation
  vec2 position = a_position + u_translation;

  // Convert position to a ratio between -1 and 1, by first doubling
  // the ratio to its dimension, doubling it, then shifting it left 1 unit
  vec2 clipSpace = (( position / u_resolution) * 2.0) - 1.0;
 
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); // flip y to inverse value
}
`;
let fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 o_color;

void main() {
  // Just set the outout to a constant color
  o_color = u_color;
}
`;

function createShader(context, type, source) {
  const shader = context.createShader(type);
  context.shaderSource(shader, source);
  context.compileShader(shader);

  if (context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    return shader;
  }

  console.log(context.getShaderInfoLog(shader));
  context.deleteShader(shader);
  return;
}

function createProgram(context, vertexShader, fragmentShader) {
  const program = context.createProgram();
  context.attachShader(program, vertexShader);
  context.attachShader(program, fragmentShader);
  context.linkProgram(program);

  if (context.getProgramParameter(program, context.LINK_STATUS)) {
    return program;
  }

  console.log(context.getProgramInfoLog(program));
  context.deleteProgram(program);
  return;
}

function resize(context, width, height) {
  context.canvas.style.width = `${width}px`;
  context.canvas.style.height = `${height}px`;
  context.canvas.width = width;
  context.canvas.height = height;
}

function setGeometry(context) {
  context.bufferData(
    context.ARRAY_BUFFER,
    new Float32Array([
      // Left column
      0, 0,
      30, 0,
      0, 150,
      0, 150,
      30, 0,
      30, 150,
      // Top rung
      30, 0,
      100, 0,
      30, 30,
      30, 30,
      100, 0,
      100, 30,
      // Middle rung
      30, 60,
      67, 60,
      30, 90,
      30, 90,
      67, 60,
      67, 90,
    ]),
    context.STATIC_DRAW
  );
}

function main() {
  // Get a WebGL context
  const canvas = document.getElementById("c");
  const context = canvas.getContext("webgl2");
  if (!context) {
    return;
  }

  // CreateGLSL shaders, upload the GLSL source, compile the shaders
  const vertexShader = createShader(context, context.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(context, context.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  const program = createProgram(context, vertexShader, fragmentShader);

  // Look up where the vertex data needs to go
  const positionAttributeLocation = context.getAttribLocation(program, "a_position");

  // Look up uniform locations
  const resolutionUniformLocation = context.getUniformLocation(program, "u_resolution");
  const colorUniformLocation = context.getUniformLocation(program, "u_color");
  const translationLocation = context.getUniformLocation(program, "u_translation");

  // Create a buffer and put three 2D clip space points into it
  const positionBuffer = context.createBuffer();

  // Create a vertex array object (attribute state)
  const vao = context.createVertexArray();

  // Make it the one we are currentling working with
  context.bindVertexArray(vao);

  // Activate the attribute
  context.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER is now positionBuffer)
  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);

  // Set Geometry
  setGeometry(context);

  // Tell the attribute how to get the data out of the positionBuffer (ARRAY_BUFFER)
  const size = 2;             // two components per iteration (x, y)
  const type = context.FLOAT  // the data is 32 bit floats
  const normalize = false;    // don't normalize the data
  const stride = 0;           // 0 means move forward size * size of type (32 bit floats) each iteration to get the next position
  const offset = 0;           // start at the beginning of the buffer
  
  context.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  // Set variables to hold the translation
  let translation = [150, 78];

  drawScene();

  function drawScene() {
    // Resize the canvas
    resize(context, 400, 300);
  
    // Tell WebGL how to convert from clip space to pixels
    context.viewport(0, 0, context.canvas.width, context.canvas.height);
  
    // Clear the canvas
    context.clearColor(0, 0, 0, 0);
    context.clear(context.COLOR_BUFFER_BIT);
  
    // Tell it to use our program (pair of shaders)
    context.useProgram(program);
  
    // Bind the attribute/buffer set we want
    context.bindVertexArray(vao);
  
    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    context.uniform2f(resolutionUniformLocation, context.canvas.width, context.canvas.height);
    
    // Set a random color
    context.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1.0);
  
    // Set the translation
    context.uniform2fv(translationLocation, translation);

    // Draw
    const drawType = context.TRIANGLES;  // type of vertex drawing
    const drawOffset = 0;                // start at the beginning of the buffer
    const drawCount = 18;                 // vertex count
    context.drawArrays(drawType, drawOffset, drawCount);
  }
}

main();