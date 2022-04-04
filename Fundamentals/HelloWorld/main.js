let vertexShaderSource = `#version 300 es
// An attribute is an input (in) to a vertex shader
// IT will recieve data from a buffer
in vec4 a_position;

// All shaders have a main function
void main() {
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`;
let fragmentShaderSource = `#version 300 es
// Fragment shaders don't have a default percision so we need
// to provide one, highp is a good default, it means "high percision"
precision highp float;

// We need to delcare an output for the fragment shader
out vec4 o_color;

void main() {
  // Just set the outout to a constant color
  o_color = vec4(1, 0.3, 0.5, 1);
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

  // Create a buffer and put three 2D clip space points into it
  const positionBuffer = context.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER is now positionBuffer)
  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);

  const positions = [
    0.0, 0.0,
    0.0, 0.5,
    0.7, 0.0
  ];

  context.bufferData(context.ARRAY_BUFFER, new Float32Array(positions), context.STATIC_DRAW);

  // Create a vertex array object (attribute state)
  const vao = context.createVertexArray();

  // Make it the one we are currentling working with
  context.bindVertexArray(vao);

  // Activate the attribute
  context.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get the data out of the positionBuffer (ARRAY_BUFFER)
  const size = 2;             // two components per iteration (x, y)
  const type = context.FLOAT  // the data is 32 bit floats
  const normalize = false;    // don't normalize the data
  const stride = 0;           // 0 means move forward size * size of type (32 bit floats) each iteration to get the next position
  const offset = 0;           // start at the beginning of the buffer
  
  context.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

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

  // Draw
  const drawType = context.TRIANGLES;  // type of vertex drawing
  const drawOffset = 0;                // start at the beginning of the buffer
  const drawCount = 3;                 // vertex count
  context.drawArrays(drawType, drawOffset, drawCount);
}

main();