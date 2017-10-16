import {Array1D, CheckpointLoader, Graph, NDArrayInitializer, NDArrayMathGPU, Session} from 'deeplearn'
import io from 'socket.io-client'

// const socket = io('http://localhost:3000')
const socket = io('http://47.95.247.253:7001')

const canvas = document.getElementById('canvas')
const source = document.createElement('canvas')

canvas.width = 300
canvas.height = 300
source.width = 28
source.height = 28

const ctx = canvas.getContext('2d')
ctx.lineCap = 'round'

export const params = {
  color: '#000',
  size: 20
}

export function clear() {
  doClear()
  socket.emit('clear')
}

socket.on('beginPath', function ({x, y, size, color}) {
  ctx.strokeStyle = color
  ctx.lineWidth = size
  ctx.moveTo(x, y)
  ctx.beginPath()
})

socket.on('draw', function ({x, y, size, color}) {
  ctx.strokeStyle = color
  ctx.lineWidth = size
  ctx.lineTo(x, y)
  ctx.stroke()
})

socket.on('end', function () {
  const ctx = source.getContext('2d')
  ctx.drawImage(canvas, 0, 0, source.width, source.height)
  predict(source)
  ctx.clearRect(0, 0, source.width, source.height)
})

socket.on('clear', doClear)

function doClear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const {left, top} = canvas.getBoundingClientRect()

canvas.addEventListener('mousedown', function (event) {

  ctx.strokeStyle = params.color
  ctx.lineWidth = params.size

  const x = event.clientX - left
  const y = event.clientY - top
  ctx.moveTo(x, y)
  ctx.beginPath()
  socket.emit('beginPath', {x, y, size: params.size, color: params.color})

  canvas.addEventListener('mousemove', drawing)

  canvas.addEventListener('mouseup', detach)

  function drawing(e) {
    const x = e.clientX - left
    const y = e.clientY - top
    ctx.lineTo(x, y)
    ctx.stroke()
    socket.emit('draw', {x, y, size: params.size, color: params.color})
  }

  function detach() {
    canvas.removeEventListener('mousemove', drawing)
    canvas.removeEventListener('mouseup', detach)
    const ctx = source.getContext('2d')
    ctx.drawImage(canvas, 0, 0, source.width, source.height)
    predict(source)
    ctx.clearRect(0, 0, source.width, source.height)
    socket.emit('end')
  }
})


function predict(image) {
  const ctx = image.getContext('2d')
  const imageData = ctx.getImageData(0, 0, image.width, image.height)
  const result = []
  const data = imageData.data
  for (let i = 0, len = data.length; i < len; i += 4) {
    result.push(data[i + 3] / 255)
  }
  const reader = new CheckpointLoader('.')
  reader.getAllVariables().then(vars => {
    const math = new NDArrayMathGPU()
    const [input, probs] = buildModelLayersAPI(result, vars)
    const sess = new Session(input.node.graph, math)
    math.scope(() => {
      const inputData = Array1D.new(result)
      const probsVal = sess.eval(probs, [{tensor: input, data: inputData}])
      const predictedLabel = Math.round(probsVal.get())
      const event = new CustomEvent('updateNum', {detail: {num: predictedLabel}})
      document.dispatchEvent(event)
    })
  })
}


function buildModelLayersAPI(data, vars) {
  const g = new Graph()
  const input = g.placeholder('input', [784])
  const hidden1W = vars['hidden1/weights']
  const hidden1B = vars['hidden1/biases']
  const hidden1 = g.layers.dense(
    'hidden1', input, hidden1W.shape[1], (x) => g.relu(x), true,
    new NDArrayInitializer(hidden1W), new NDArrayInitializer(hidden1B))

  const hidden2W = vars['hidden2/weights']
  const hidden2B = vars['hidden2/biases']
  const hidden2 = g.layers.dense(
    'hidden2', hidden1, hidden2W.shape[1], (x) => g.relu(x), true,
    new NDArrayInitializer(hidden2W), new NDArrayInitializer(hidden2B))

  const softmaxW = vars['softmax_linear/weights']
  const softmaxB = vars['softmax_linear/biases']
  const logits = g.layers.dense(
    'softmax', hidden2, softmaxW.shape[1], null, true,
    new NDArrayInitializer(softmaxW), new NDArrayInitializer(softmaxB))
  return [input, g.argmax(logits)]
}
