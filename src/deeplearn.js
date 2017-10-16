
import {
    NDArrayMathGPU,
    Array2D,
    Array1D,
    Graph,
    Scalar,
    Session,
    SGDOptimizer,
    InCPUMemoryShuffledInputProviderBuilder,
    CostReduction,
} from 'deeplearn'

const graph = new Graph()

const x = graph.placeholder('x', [])

const a = graph.variable('a', Scalar.new(Math.random()))
const b = graph.variable('b', Scalar.new(Math.random()))
const c = graph.variable('c', Scalar.new(Math.random()))

const order2 = graph.multiply(a, graph.square(x))
const order1 = graph.multiply(b, x)
const y = graph.add(graph.add(order2, order1), c)

const yLabel = graph.placeholder('y label', [])

const cost = graph.meanSquaredCost(y, yLabel)


const math = new NDArrayMathGPU()

const session = new Session(graph, math)

math.scope((keep, track) => {
    let result = session.eval(y, [
        {tensor: x, data: track(Scalar.new(4))}
    ])
    console.log(result.shape)
    console.log(result.getValues())


    const xs = [
        track(Scalar.new(0)),
        track(Scalar.new(1)),
        track(Scalar.new(2)),
        track(Scalar.new(3))
    ]

    const ys = [
        track(Scalar.new(1.1)),
        track(Scalar.new(5.9)),
        track(Scalar.new(16.8)),
        track(Scalar.new(33.9))
    ]

    const shuffledInputProviderBuilder = new InCPUMemoryShuffledInputProviderBuilder([xs, ys])
    const [xProvider, yProvider] = shuffledInputProviderBuilder.getInputProviders()

    const NUM_BATCHES = 20
    const BATCH_SIZE = xs.length
    const LEARNING_RATE = .01

    const optimizer = new SGDOptimizer(LEARNING_RATE)

    for (let i = 0; i < NUM_BATCHES; i++) {
        const costValue = session.train(
            cost,
            [{tensor: x, data: xProvider}, {tensor: yLabel, data: yProvider}],
            BATCH_SIZE,
            optimizer,
            CostReduction.MEAN
        )
        console.log('average cost: ' + costValue.get())
    }


    result = session.eval(y, [{tensor: x, data: track(Scalar.new(4))}])

    console.log('result should be ~57.0:')
    console.log(result.shape)
    console.log(result.getValues())
})

