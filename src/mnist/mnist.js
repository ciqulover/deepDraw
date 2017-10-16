"use strict";
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:max-line-length
var deeplearn_1 = require("deeplearn");
// manifest.json lives in the same directory as the mnist demo.
var reader = new deeplearn_1.CheckpointLoader('.');
reader.getAllVariables().then(function (vars) {
    // Get sample data.
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'sample_data.json');
    xhr.onload = function () {
        var data = JSON.parse(xhr.responseText);
        var math = new deeplearn_1.NDArrayMathGPU();
        var _a = buildModelLayersAPI(data, vars), input = _a[0], probs = _a[1];
        var sess = new deeplearn_1.Session(input.node.graph, math);
        math.scope(function () {
            console.log("Evaluation set: n=" + data.images.length + ".");
            var numCorrect = 0;
            for (var i = 0; i < data.images.length; i++) {
                var inputData = deeplearn_1.Array1D.new(data.images[i]);
                var probsVal = sess.eval(probs, [{ tensor: input, data: inputData }]);
                console.log("Item " + i + ", probsVal " + probsVal.get() + ".");
                var label = data.labels[i];
                var predictedLabel = Math.round(probsVal.get());
                if (label === predictedLabel) {
                    numCorrect++;
                }
                var result = renderResults(deeplearn_1.Array1D.new(data.images[i]), label, predictedLabel);
                document.body.appendChild(result);
            }
            var accuracy = numCorrect * 100 / data.images.length;
            console.log(accuracy + '%');
        });
    };
    xhr.onerror = function (err) { return console.error(err); };
    xhr.send();
});
/**
 * Builds a 3-layer fully connected MNIST model using the Math API. This is the
 * lowest level user-facing API in Learn.js giving the most control to the user.
 * Math commands execute immediately, like numpy. Math commands are wrapped in
 * math.scope() so that NDArrays created by intermediate math commands are
 * automatically cleaned up.
 */
function buildModelMathAPI(math, data, vars) {
    var hidden1W = vars['hidden1/weights'];
    var hidden1B = vars['hidden1/biases'];
    var hidden2W = vars['hidden2/weights'];
    var hidden2B = vars['hidden2/biases'];
    var softmaxW = vars['softmax_linear/weights'];
    var softmaxB = vars['softmax_linear/biases'];
    return function (x) {
        return math.scope(function () {
            var hidden1 = math.relu(math.add(math.vectorTimesMatrix(x, hidden1W), hidden1B));
            var hidden2 = math.relu(math.add(math.vectorTimesMatrix(hidden1, hidden2W), hidden2B));
            var logits = math.add(math.vectorTimesMatrix(hidden2, softmaxW), softmaxB);
            return math.argMax(logits);
        });
    };
}
exports.buildModelMathAPI = buildModelMathAPI;
/**
 * Builds a 3-layers fully connected MNIST model using the Graph API. This API
 * mimics the TensorFlow API, providing a lazy execution with feeds and fetches.
 * Users do not need to worry about GPU-related memory leaks, other than their
 * input data.
 */
function buildModelGraphAPI(data, vars) {
    var g = new deeplearn_1.Graph();
    // TODO: Support batching.
    var input = g.placeholder('input', [784]);
    var hidden1W = g.constant(vars['hidden1/weights']);
    var hidden1B = g.constant(vars['hidden1/biases']);
    var hidden1 = g.relu(g.add(g.matmul(input, hidden1W), hidden1B));
    var hidden2W = g.constant(vars['hidden2/weights']);
    var hidden2B = g.constant(vars['hidden2/biases']);
    var hidden2 = g.relu(g.add(g.matmul(hidden1, hidden2W), hidden2B));
    var softmaxW = g.constant(vars['softmax_linear/weights']);
    var softmaxB = g.constant(vars['softmax_linear/biases']);
    var logits = g.add(g.matmul(hidden2, softmaxW), softmaxB);
    return [input, g.argmax(logits)];
}
exports.buildModelGraphAPI = buildModelGraphAPI;
/**
 * Builds a 3-layers fully connected MNIST model using the Graph API in
 * conjuction with `Graph.layers`, which mimics the Keras layers API.
 */
function buildModelLayersAPI(data, vars) {
    var g = new deeplearn_1.Graph();
    // TODO: Support batching.
    var input = g.placeholder('input', [784]);
    var hidden1W = vars['hidden1/weights'];
    var hidden1B = vars['hidden1/biases'];
    var hidden1 = g.layers.dense('hidden1', input, hidden1W.shape[1], function (x) { return g.relu(x); }, true, new deeplearn_1.NDArrayInitializer(hidden1W), new deeplearn_1.NDArrayInitializer(hidden1B));
    var hidden2W = vars['hidden2/weights'];
    var hidden2B = vars['hidden2/biases'];
    var hidden2 = g.layers.dense('hidden2', hidden1, hidden2W.shape[1], function (x) { return g.relu(x); }, true, new deeplearn_1.NDArrayInitializer(hidden2W), new deeplearn_1.NDArrayInitializer(hidden2B));
    var softmaxW = vars['softmax_linear/weights'];
    var softmaxB = vars['softmax_linear/biases'];
    var logits = g.layers.dense('softmax', hidden2, softmaxW.shape[1], null, true, new deeplearn_1.NDArrayInitializer(softmaxW), new deeplearn_1.NDArrayInitializer(softmaxB));
    return [input, g.argmax(logits)];
}
function renderMnistImage(array) {
    console.log('renderMnistImage', array);
    var width = 28;
    var height = 28;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var float32Array = array.getData().values;
    var imageData = ctx.createImageData(width, height);
    for (var i = 0; i < float32Array.length; i++) {
        var j = i * 4;
        var value = Math.round(float32Array[i] * 255);
        imageData.data[j + 0] = value;
        imageData.data[j + 1] = value;
        imageData.data[j + 2] = value;
        imageData.data[j + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
function renderResults(array, label, predictedLabel) {
    var root = document.createElement('div');
    root.appendChild(renderMnistImage(array));
    var actual = document.createElement('div');
    actual.innerHTML = "Actual: " + label;
    root.appendChild(actual);
    var predicted = document.createElement('div');
    predicted.innerHTML = "Predicted: " + predictedLabel;
    root.appendChild(predicted);
    if (label !== predictedLabel) {
        root.classList.add('error');
    }
    root.classList.add('result');
    return root;
}
